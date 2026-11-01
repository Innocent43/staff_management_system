from fastapi import HTTPException,status
from sqlalchemy import func,select
from sqlalchemy.orm import Session

from app.models.employee_profile import EmployeeProfile
from app.models.membership import Membership
from app.models.work_schedule import WorkSchedule
from app.schemas.schedule import ScheduleCreate,ScheduleOut,ScheduleUpdate
from app.services.audit_service import log_action,to_log_value

def _get_schedule(db:Session,business_id:int,schedule_id: int)->WorkSchedule:
    schedule= db.scalar(select(WorkSchedule).where(WorkSchedule.id == schedule_id,WorkSchedule.business_id == business_id,))

    if schedule is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND,"Schedule not found")
    return schedule

def _name_taken(db: Session, business_id: int,name:str,exclude_id: int | None = None)->bool:
    query = select(WorkSchedule.id).where(WorkSchedule.business_id == business_id, WorkSchedule.name == name,)
    if exclude_id:
        query = query.where(WorkSchedule.id != exclude_id)
    return db.scalar(query) is not None



def create_schedule(db: Session,actor: Membership,data: ScheduleCreate)-> WorkSchedule:
    if _name_taken(db,actor.business_id,data.name):
        raise HTTPException(status.HTTP_409_CONFLICT,"You already have a schedule with this name")

    schedule = WorkSchedule(business_id=actor.business_id, **data.model_dump())
    db.add(schedule)
    db.flush()
    log_action(
        db,business_id=actor.business_id,actor_user_id=actor.user_id,action="schedule.created",entity_type="schedule",entity_id=schedule.id,details={"name": schedule.name},
    )
    db.commit()

    return schedule



def list_schedules(db:Session,business_id: int)->list[WorkSchedule]:
    query = select(WorkSchedule).where(WorkSchedule.business_id ==business_id).order_by(WorkSchedule.name)
    return list(db.scalars(query).all())

def update_schedule(db: Session,actor: Membership,schedule_id: int,data: ScheduleUpdate)-> WorkSchedule:
    schedule = _get_schedule(db,actor.business_id,schedule_id)
    changes = data.model_dump(exclude_unset=True)

    for field,value in changes.items():
        if value is None:
            raise HTTPException(422,f"{field} cannot be empty")
    if "name" in changes and _name_taken(db,actor.business_id,changes["name"],schedule.id):
        raise HTTPException(status.HTTP_409_CONFLICT,"You already have a schedule with this name")

    audit_changes={}
    for field,new_value in changes.items():
        old_value = getattr(schedule,field)
        if old_value != new_value:
            audit_changes[field]={
                "old": to_log_value(old_value),
                "new": to_log_value(new_value),
            }

            setattr(schedule,field,new_value)

    if schedule.start_time == schedule.end_time:
        raise HTTPException(422,"Start time and end time cannot be the same")

    if audit_changes:
        log_action(
            db,business_id=actor.business_id,actor_user_id=actor.user_id,action="schedule.updated",entity_type="schedule",
                entity_id=schedule.id,details={"changes": audit_changes},
            )
        db.commit()
        return schedule


def delete_schedule(db: Session,actor: Membership,schedule_id: int)->None:
    schedule =_get_schedule(db,actor.business_id,schedule_id)
    in_use = db.scalar(select(func.count()).select_from(EmployeeProfile).where(EmployeeProfile.schedule_id == schedule.id))

    if in_use:
        raise HTTPException(status.HTTP_409_CONFLICT,f"{in_use} employee(s) use this schedule. Move them to another schedule first.",)

    log_action(db,business_id=actor.business_id,actor_user_id=actor.user_id,action="schedule.deleted",entity_type="schedule",entity_id=schedule.id, details={"name": schedule.name},)
    db.delete(schedule)
    db.commit()

    
