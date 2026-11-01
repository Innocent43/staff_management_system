from fastapi import HTTPException,status
from sqlalchemy import or_,select
from sqlalchemy.orm import Session,contains_eager

from app.models.employee_profile import EmployeeProfile
from app.models.enums import MembershipStatus,Role
from app.models.membership import Membership
from app.models.user import User
from app.models.work_schedule import WorkSchedule
from app.schemas.employee import EmployeeUpdate
from app.services.audit_service import log_action,to_log_value


OWNER_ONLY_FIELDS = {"wage_type","wage_rate","role"}


def get_employee(db: Session,business_id: int, employee_id: int)-> EmployeeProfile:
    profile = db.scalar(select(EmployeeProfile).where(EmployeeProfile.id == employee_id, EmployeeProfile.business_id == business_id))

    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Employee not found")

    return profile



def list_employees(db: Session, business_id: int, status_filter: MembershipStatus | None, search: str | None,limit: int,offset: int,)->list[EmployeeProfile]:
    query = (select(EmployeeProfile).join(EmployeeProfile.membership).join(Membership.user).options(contains_eager(EmployeeProfile.membership).contains_eager(Membership.user)).where(EmployeeProfile.business_id == business_id))

    if status_filter:
        query = query.where(Membership.status ==status_filter)
    if search:
        pattern = f"%{search}%"
        query = query.where(or_(
            User.full_name.ilike(pattern),User.email.ilike(pattern),EmployeeProfile.staff_code.ilike(pattern),
        ))

    query = query.order_by(User.full_name).limit(limit).offset(offset)

    return list(db.scalars(query).all())

def _check_can_manage(actor: Membership, target: EmployeeProfile)->None:
    if actor.role == Role.owner:
        return
    if target.membership.role != Role.employee:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="Managers can only manage employees")



def update_employee(db: Session, actor: Membership, employee_id: int, data: EmployeeUpdate)->EmployeeProfile:
    profile=get_employee(db,actor.business_id,employee_id)
    _check_can_manage(actor,profile)

    changes = data.model_dump(exclude_unset=True)

    if actor.role != Role.owner and OWNER_ONLY_FIELDS & changes.keys():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="Only the owner can change wages or roles")

    for field in OWNER_ONLY_FIELDS:
        if field in changes and changes[field] is None:
            raise HTTPException(422,f"{field} cannot be empty")

    if "role" in changes and profile.membership.role == Role.owner:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail="The owner role cannot be changed")

    if changes.get("schedule_id") is not None:
        schedule = db.scalar(select(WorkSchedule).where(WorkSchedule.id == changes["schedule_id"],WorkSchedule.business_id == actor.business_id,))
        if schedule is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND,"Schedule not found")

    if changes.get("staff_code"):
        clash = db.scalar(
                select(EmployeeProfile).where(EmployeeProfile.business_id == actor.business_id,EmployeeProfile.staff_code == changes["staff_code"],EmployeeProfile.id != profile.id,)
            )

        if clash:
            raise HTTPException(status.HTTP_409_CONFLICT,"Staff code already in use")

    audit_changes = {}

    for field,new_value in changes.items():
            target = profile.membership if field == "role" else profile
            old_value = getattr(target,field)
            if old_value != new_value:
                audit_changes[field]={
                        "old": to_log_value(old_value),
                        "new": to_log_value(new_value),
                    }

                setattr(target,field,new_value)

    if audit_changes:
            log_action(db,business_id=actor.business_id,
                           actor_user_id=actor.user_id,
                           action="employee.updated",
                           entity_type="employee",
                           entity_id=profile.id,
                           details={"changes": audit_changes},)
            
            db.commit()
    return profile


def deactivate_employee(db: Session,actor: Membership,employee_id: int)->EmployeeProfile:
    profile=get_employee(db,actor.business_id,employee_id)
    membership=profile.membership

    if membership.id == actor.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST,"You cannot deactivate yourself")
    if membership.role == Role.owner:
        raise HTTPException(status.HTTP_400_BAD_REQUEST,"The owner cannot be deactivated")
    _check_can_manage(actor,profile)
    if membership.status == MembershipStatus.deactivated:
        raise HTTPException(status.HTTP_409_CONFLICT,"Already deactivated")

    membership.status = MembershipStatus.deactivated
    membership.invite_token_hash = None
    membership.invite_expires_at = None
    log_action(db,business_id=actor.business_id,actor_user_id=actor.user_id,action="employee.deactivated",entity_type="employee",entity_id=profile.id)
    db.commit()
    return profile


def reactivate_employee(db: Session,actor: Membership, employee_id: int)-> EmployeeProfile:
    profile=get_employee(db,actor.business_id,employee_id)
    membership = profile.membership
    _check_can_manage(actor,profile)
    if membership.status != MembershipStatus.deactivated:
        raise HTTPException(status.HTTP_409_CONFLICT,"This employee is not deactivated")
    if membership.user.password_hash is None:
        raise HTTPException(status.HTTP_409_CONFLICT,"This person never accepted their invite . Send a new one instead .",)

    membership.status = MembershipStatus.active
    log_action(
        db,business_id=actor.business_id,
        actor_user_id=actor.user_id,
        action="employee.reactivated",
        entity_type="employee",
        entity_id=profile.id,
    )
    db.commit()
    return profile



def get_my_profile(db: Session, actor: Membership)->EmployeeProfile:
    profile = db.scalar(select(EmployeeProfile).where(EmployeeProfile.membership_id == actor.id))

    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND,"Employee profile not found")
    return profile

