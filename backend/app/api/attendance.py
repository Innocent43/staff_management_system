from typing import Annotated

from fastapi import APIRouter,Depends,Query,status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.membership import Membership
from app.models.enums import Role
from app.schemas.attendance import (AttendanceFilters,AttendanceOut,AttendanceStatusOut,ClockRequest,CorrectionOut,ManageAttendanceFilters,ManualEventCreate,ShiftFilters,ShiftOut,TimeCorrection,TodayRowOut,VoidRequest)

from app.security.dependencies import get_current_membership,require_roles
from app.security.rate_limit import check_rate_limit
from app.services import attendance_service

router = APIRouter(prefix="/attendance",tags=["Attendance"])

manager_or_owner = Depends(require_roles(Role.owner,Role.manager))


@router.post("/clock", response_model=AttendanceOut,status_code=status.HTTP_201_CREATED)
def clock(data: ClockRequest,membership: Membership = Depends(get_current_membership),db: Session = Depends(get_db)):
    check_rate_limit(f"clock:{membership.id}", 20, 60)

    return attendance_service.clock(db,membership,data)

@router.get("/me/status", response_model=AttendanceStatusOut)
def my_status(membership: Membership = Depends(get_current_membership), db: Session = Depends(get_db)):
    return attendance_service.get_my_status(db,membership)


@router.get("/me",response_model=list[AttendanceOut])
def my_events(filters: Annotated[AttendanceFilters, Query()], membership: Membership = Depends(get_current_membership),db: Session = Depends(get_db)):
    return attendance_service.list_my_events(db,membership,filters)


@router.get("",response_model=list[AttendanceOut])
def list_events(filters: Annotated[ManageAttendanceFilters,Query()],membership: Membership = manager_or_owner,db: Session = Depends(get_db),):
    return attendance_service.list_events(db,membership,filters)


@router.get("/today",response_model=list[TodayRowOut])
def get_today(membership: Membership = manager_or_owner,db: Session = Depends(get_db)):
    return attendance_service.get_today(db,membership)


@router.get("/shifts", response_model=list[ShiftOut])
def list_shifts(filters: Annotated[ShiftFilters,Query()], membership: Membership = manager_or_owner, db: Session = Depends(get_db)):
    return attendance_service.list_shifts(db,membership,filters)


@router.post("/manual", response_model=AttendanceOut, status_code=status.HTTP_201_CREATED)
def add_manual_event(data: ManualEventCreate, membership: Membership = manager_or_owner, db: Session = Depends(get_db)):
    return attendance_service.add_manual_event(db,membership,data)



@router.patch("/{event_id}", response_model=AttendanceOut)
def correct_event_time(event_id: int, data: TimeCorrection, membership: Membership = manager_or_owner, db: Session = Depends(get_db)):
    return attendance_service.correct_event_time(db,membership,event_id,data)


@router.post("/{event_id}/void", response_model=AttendanceOut)
def void_event(event_id: int,
               data: VoidRequest, membership: Membership = manager_or_owner, db: Session = Depends(get_db)):
    return attendance_service.void_event(db,membership,event_id,data)


@router.get("/{event_id}/corrections", response_model=list[CorrectionOut])
def list_corrections(event_id: int,membership: Membership = manager_or_owner, db: Session = Depends(get_db)):
    return attendance_service.list_corrections(db,membership,event_id)