import logging
from datetime import datetime,timezone,timedelta    

from fastapi import HTTPException,status
from redis.exceptions import RedisError
from rq import Retry
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.queue import email_queue

from app.models.enums import MembershipStatus,Role
from app.models.membership import Membership
from app.models.user import User
from app.models.employee_profile import EmployeeProfile

from app.schemas.auth import AcceptInvitedRequest
from app.schemas.employee import InviteRequest
from app.security.password import hash_password
from app.security.tokens import create_access_token,generate_invite_token,hash_invite_token
from app.services.email_service import send_invite_email

logger = logging.getLogger(__name__)
INVITED_VALID_DAYS=7


def invite_employee(db: Session, inviter: Membership, data: InviteRequest)-> Membership:
    if data.role == Role.manager and inviter.role != Role.owner:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="Only the owner can invite managers")
    email = data.email.lower()

    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        if data.phone and db.scalar(select(User).where(User.phone == data.phone)):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT,detail="Phone already registered")
        user = User(full_name=data.full_name,email=email,phone=data.phone)
        db.add(user)
        db.flush()

    membership = db.scalar(select(Membership).where(Membership.business_id == inviter.business_id, Membership.user_id == user.id))

    if membership and membership.status == MembershipStatus.active:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,detail="This person already belongs to your business")
    if membership is None:
        membership = Membership(business_id=inviter.business_id,user=user)
        db.add(membership)
        db.add(EmployeeProfile(business_id=inviter.business_id, membership=membership))

    raw_token,token_hash = generate_invite_token()
    membership.role = data.role
    membership.status = MembershipStatus.invited
    membership.invite_token_hash = token_hash
    membership.invite_expires_at = datetime.now(timezone.utc) + timedelta(days=INVITED_VALID_DAYS)
    db.commit()

    invite_link = f"{settings.frontend_url}/accept-invite?token={raw_token}"
    try:
        email_queue.enqueue(
            send_invite_email,
            user.email,
            user.full_name,
            inviter.business.name,
            invite_link,
            retry=Retry(max=3,interval=[10,60,300]),
        )
    except RedisError:
        logger.error("Could not queue invite email: membership_id=%s", membership.id, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,detail="Invite saved but the email could not be queued. please invite again."
        )

    logger.info("Invite created: membership_id=%s by membership_id=%s", membership.id, inviter.id)
    return membership




def _find_valid_invite(db: Session, raw_token: str)->Membership:
    membership = db.scalar(select(Membership).where(Membership.invite_token_hash == hash_invite_token(raw_token),Membership.status == MembershipStatus.invited,))

    now =datetime.now(timezone.utc)

    if (
        membership is None or membership.invite_expires_at is None or membership.invite_expires_at < now or not membership.user.is_active
    ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="Invite link is invalid or has expired")

    return membership



def get_invite_info(db: Session,token: str)->Membership:
    return _find_valid_invite(db,token)




def accept_invite(db:Session,data: AcceptInvitedRequest)->str:
    membership = _find_valid_invite(db,data.token)

    user = membership.user

    if user.password_hash is None:
        if not data.password:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="password is required")

        user.password_hash = hash_password(data.password)

    membership.status = MembershipStatus.active
    membership.invite_token_hash = None
    membership.invite_expires_at = None
    db.commit()
    logger.info("Invite accepted: membership_id=%s", membership.id)
    return create_access_token(user.id,membership.id)