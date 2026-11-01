from fastapi import APIRouter,Depends,status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.enums import Role
from app.models.membership import Membership
from app.schemas.schedule import ScheduleUpdate,ScheduleCreate,ScheduleOut
from app.security.dependencies import require_roles
from app.services import schedule_services

router = APIRouter(prefix="/schedules",tags=["Schedules"])

manager_or_owner = Depends(require_roles(Role.owner,Role.manager))

@router.post("",response_model=ScheduleOut, status_code=status.HTTP_201_CREATED)
def create_schedule(data: ScheduleCreate, membership: Membership = manager_or_owner,db: Session=Depends(get_db)):
    return schedule_services.create_schedule(db,membership,data)


@router.get("", response_model=list[ScheduleOut])
def list_schedules(membership: Membership=manager_or_owner,db: Session=Depends(get_db)):
    return schedule_services.list_schedules(db,membership.business_id)

@router.patch("/{schedule_id}", response_model=ScheduleOut)
def update_schedule(schedule_id: int,data: ScheduleUpdate,membership: Membership=manager_or_owner,db: Session=Depends(get_db)):
    return schedule_services.update_schedule(db,membership,schedule_id,data)

@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule(schedule_id: int,membership: Membership = manager_or_owner,db: Session=Depends(get_db)):
    schedule_services.delete_schedule(db,membership,schedule_id)