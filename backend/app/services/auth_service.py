from fastapi import HTTPException,status
from sqlalchemy.orm import Session
from sqlalchemy import select

import logging
from app.models.membership import Membership
from app.models.business import Business
from app.models.user import User
from app.models.enums import Role,MembershipStatus
from app.models.employee_profile import EmployeeProfile

from app.schemas.auth import RegisterRequest,LoginRequest
from app.security.tokens import create_access_token
from app.security.password import verify_password,hash_password

logger = logging.getLogger(__name__)



def register_business(db: Session, data: RegisterRequest)->Membership:
    email = data.email.lower()

    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,detail="Email already registered")
    if data.phone and db.scalar(select(User).where(User.phone == data.phone)):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,detail="Phone already registered")

    business = Business(
        name = data.business_name,
        timezone = data.timezone,
        currency = data.currency.upper()
    )

    user = User(
        full_name = data.full_name,
        email = email,
        phone = data.phone,
        password_hash = hash_password(data.password)
    )

    membership = Membership(
        business = business,
        user = user,
        role = Role.owner,
        status = MembershipStatus.active
    )

    profile = EmployeeProfile(business=business, membership=membership)

    db.add(membership)
    db.add(profile)
    db.commit()
    logger.info("Business registered: business_id=%s user_id=%s", business.id, user.id)
    return membership


def login(db: Session, data: LoginRequest)-> str:
    user = db.scalar(select(User).where(User.email == data.email.lower()))

    if (not user or not user.is_active or not user.password_hash or not verify_password(data.password, user.password_hash)):
        logger.warning("Failed login attempt")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="incorrect email or password")

    query = select(Membership).where(Membership.user_id ==user.id, Membership.status == MembershipStatus.active)

    if data.business_id:
        query = query.where(Membership.business_id == data.business_id)
    memberships = db.scalars(query).all()
    if not memberships:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No active access to a business")
    if len(memberships) > 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="you belong to several businesses: send business_id")

    logger.info("Login: user_id=%s business_id=%s", user.id, memberships[0].business_id)

    return create_access_token(user.id, memberships[0].id)
