from collections import defaultdict
from datetime import datetime,timedelta,timezone

from fastapi import HTTPException,status
from sqlalchemy import select
from sqlalchemy.orm import Session,selectinload

from app.core.timezone import local_day_end,local_day_start,local_date
from app.models.attendance_correction import AttendanceCorrection
from app.models.attendance_event import AttendanceEvent
from app.models.employee_profile import EmployeeProfile
from app.models.enums import EventSource,EventType,CorrectionAction,MembershipStatus,Role,PayStatus
from app.models.pay_summary import PaySummary

from app.models.membership import Membership
from app.models.workplace_qr import WorkplaceQR
from app.schemas.attendance import (
    AttendanceFilters,AttendanceStatusOut,ClockRequest,ManageAttendanceFilters,ManualEventCreate,ShiftFilters,ShiftOut,TimeCorrection,TodayRowOut,VoidRequest,
    )
from app.security.qr_tokens import is_qr_token_valid,read_workplace_id
from app.services.shift_service import MAX_OPEN_SHIFT_HOURS,build_shifts
from app.services import employee_service
from app.services.audit_service import audit

# MAX_OPEN_SHIFT_HOURS = 16


def _get_my_profile(db: Session,actor: Membership)->EmployeeProfile:
    profile=db.scalar(select(EmployeeProfile).where(EmployeeProfile.membership_id == actor.id))
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND,"Employee profile not found")
    return profile

def _last_envent(db:Session,employee_id: int)->AttendanceEvent | None:
    return db.scalar(select(AttendanceEvent).where(AttendanceEvent.employee_id == employee_id,AttendanceEvent.is_voided.is_(False),).order_by(AttendanceEvent.occurred_at.desc(),AttendanceEvent.id.desc()).limit(1))

def _is_clocked_in(last_event: AttendanceEvent | None)->bool:
    if last_event is None or last_event.event_type != EventType.clock_in:
        return False
    age = datetime.now(timezone.utc) - last_event.occurred_at
    return age < timedelta(hours=MAX_OPEN_SHIFT_HOURS)



def _check_qr_token(db: Session,actor: Membership,qr_token: str)->WorkplaceQR:
    workplace_id = read_workplace_id(qr_token)
    workplace = db.get(WorkplaceQR,workplace_id) if workplace_id is not None else None

    if (
        workplace is None or workplace.business_id != actor.business_id or not workplace.active or not is_qr_token_valid(qr_token,workplace.secret)
    ):
        raise HTTPException(status.HTTP_400_BAD_REQUEST,"Invalid or expired QR code")

    return workplace


def clock(db: Session,actor: Membership,data: ClockRequest)->AttendanceEvent:
    profile = _get_my_profile(db,actor)
    db.refresh(profile,with_for_update=True)
    repeat = db.scalar(select(AttendanceEvent).where(AttendanceEvent.employee_id == profile.id,AttendanceEvent.request_id == data.request_id,))

    if repeat:
        return repeat

    workplace = _check_qr_token(db,actor,data.qr_token)

    clocked_in = _is_clocked_in(_last_envent(db,profile.id))

    if data.event_type == EventType.clock_in and clocked_in:
        raise HTTPException(status.HTTP_409_CONFLICT,"You already clocked in")

    if data.event_type == EventType.clock_out and not clocked_in:
        raise HTTPException(status.HTTP_409_CONFLICT,"You are not clocked in")

    event = AttendanceEvent(
        business_id=actor.business_id,
        employee_id=profile.id,
        workplace_id=workplace.id,
        created_by_id=actor.id,
        event_type=data.event_type,
        source=EventSource.qr,
        request_id=data.request_id,
        
    )
    db.add(event)
    db.commit()
    return event


def get_my_status(db: Session,actor: Membership)->AttendanceStatusOut:
    profile=_get_my_profile(db,actor)
    last_event =_last_envent(db,profile.id)

    clocked_in = _is_clocked_in(last_event)
    since = last_event.occurred_at if clocked_in else None
    return AttendanceStatusOut(clocked_in=clocked_in,since=since)

def list_my_events(db: Session,actor: Membership,filters: AttendanceFilters,)-> list[AttendanceEvent]:
    profile = _get_my_profile(db,actor)
    timezone_name = actor.business.timezone

    query = select(AttendanceEvent).where(AttendanceEvent.employee_id == profile.id)

    if filters.date_from:
        query = query.where(AttendanceEvent.occurred_at >= local_day_start(filters.date_from,timezone_name))

    if filters.date_to:
        query = query.where(AttendanceEvent.occurred_at < local_day_end(filters.date_to,timezone_name))

    query = (
        query.order_by(AttendanceEvent.occurred_at.desc()).limit(filters.limit).offset(filters.offset)
    )

    return list(db.scalars(query).all())







def _get_event(db: Session, actor: Membership,event_id: int)-> AttendanceEvent:
    event = db.scalar(select(AttendanceEvent).where(AttendanceEvent.id == event_id, AttendanceEvent.business_id == actor.business_id,))

    if event is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND,"Attendance record not found")
    return event



def _check_can_edit(actor: Membership,profile: EmployeeProfile)->None:
    if actor.role == Role.owner:
        return
    if profile.membership.role != Role.employee:
        raise HTTPException(status.HTTP_403_FORBIDDEN,"Managers can only edit employees' attendance")



def _check_not_future(moment: datetime)->None:
    if moment > datetime.now(timezone.utc) + timedelta(minutes=5):
        raise HTTPException(status.HTTP_400_BAD_REQUEST,"The time cannot be in the future")





def _check_period_open(db: Session, actor: Membership, profile: EmployeeProfile, moment: datetime)->None:
    day = local_date(moment,actor.business.timezone)
    locked = db.scalar(select(PaySummary.id).where(PaySummary.employee_id == profile.id,PaySummary.status == PayStatus.approved,PaySummary.period_start <= day,PaySummary.period_end >= day,))

    if locked:
        raise HTTPException(status.HTTP_409_CONFLICT,"This date is inside an approved pay period and cannot be changed.")


def _profiles_query(actor: Membership):
    return (select(EmployeeProfile).where(EmployeeProfile.business_id == actor.business_id).options(selectinload(EmployeeProfile.membership).selectinload(Membership.user),selectinload(EmployeeProfile.schedule)))



def _events_by_employee(db: Session,actor: Membership,start: datetime,end: datetime)-> dict[int, list[AttendanceEvent]]:
    query = (
        select(AttendanceEvent).where(AttendanceEvent.business_id == actor.business_id,AttendanceEvent.is_voided.is_(False),AttendanceEvent.occurred_at >= start,AttendanceEvent.occurred_at < end,).order_by(AttendanceEvent.occurred_at)
    )

    events_by_employee = defaultdict(list)
    for event in db.scalars(query):
        events_by_employee[event.employee_id].append(event)
    return events_by_employee








def list_events(db:Session,actor:Membership, filters: ManageAttendanceFilters)->list[AttendanceEvent]:
    timezone_name = actor.business.timezone
    query = select(AttendanceEvent).where(AttendanceEvent.business_id == actor.business_id)

    if filters.employee_id:
        query = query.where(AttendanceEvent.employee_id == filters.employee_id)
    if not filters.include_voided:
        query = query.where(AttendanceEvent.is_voided.is_(False))
    if filters.date_from:
        query=query.where(AttendanceEvent.occurred_at >= local_day_start(filters.date_from,timezone_name))
    if filters.date_to:
        query=query.where(AttendanceEvent.occurred_at < local_day_end(filters.date_to,timezone_name))

    query=(query.order_by(AttendanceEvent.occurred_at.desc()).limit(filters.limit).offset(filters.offset))

    return list(db.scalars(query).all())



def list_shifts(db: Session, actor: Membership,filters: ShiftFilters)->list[ShiftOut]:
    timezone_name = actor.business.timezone
    window_start = local_day_start(filters.date_from,timezone_name) - timedelta(days=1)

    window_end = local_day_end(filters.date_to,timezone_name) + timedelta(days=1)

    query = _profiles_query(actor)

    if filters.employee_id:
        query = query.where(EmployeeProfile.id == filters.employee_id)
    profiles = db.scalars(query).all()

    event_by_employee = _events_by_employee(db,actor,window_start,window_end)

    shifts = []

    for profile in profiles:
        employee_shifts = build_shifts(profile,event_by_employee.get(profile.id,[]))
        for shift in employee_shifts:
            started_at = shift.clock_in or shift.clock_out
            if filters.date_from <= local_date(started_at,timezone_name) <= filters.date_to:
                shifts.append(shift)
    shifts.sort(key=lambda shift: shift.clock_in or shift.clock_out)
    return shifts




def _is_today(moment: datetime | None, today, timezone_name: str)->bool:
    return moment is not None and local_date(moment,timezone_name) == today


def get_today(db: Session, actor: Membership)->list[TodayRowOut]:
    timezone_name = actor.business.timezone
    today = local_date(datetime.now(timezone.utc),timezone_name)
    window_start = local_day_start(today,timezone_name) - timedelta(days=1)
    window_end = local_day_end(today,timezone_name)

    profiles = db.scalars(_profiles_query(actor).join(EmployeeProfile.membership).where(Membership.status == MembershipStatus.active)).all()

    events_by_employee = _events_by_employee(db,actor,window_start,window_end)

    rows = []
    for profile in profiles:
        name = profile.membership.user.full_name
        shifts = build_shifts(profile,events_by_employee.get(profile.id,[]))

        for shift in shifts:
            if "in_progress" in shift.flags:
                rows.append(TodayRowOut(employee_id=profile.id,employee_name=name,status="clocked_in",since=shift.clock_in,late_minutes=shift.late_minutes))
                break
            else:
                todays_shifts = [
                    shift for shift in shifts if _is_today(shift.clock_in,today,timezone_name) or _is_today(shift.clock_out,today,timezone_name)
                ]
                if todays_shifts:
                    last_shift = todays_shifts[-1]
                    rows.append(
                        TodayRowOut(
                            employee_id=profile.id,employee_name=name,status="clocked_out",since=last_shift.clock_in or last_shift.clock_out,late_minutes=last_shift.late_minutes,

                        )
                    )
                else:
                    rows.append(TodayRowOut(
                        employee_id=profile.id,employee_name=name,status="not_in",
                        since=None,late_minutes=0
                    ))
    rows.sort(key=lambda row: row.employee_name)
    return rows



def add_manual_event(db: Session,actor: Membership,data: ManualEventCreate)-> AttendanceEvent:
    profile = employee_service.get_employee(db,actor.business_id,data.employee_id)
    _check_can_edit(actor,profile)
    _check_not_future(data.occurred_at)
    _check_period_open(db,actor,profile,data.occurred_at)

    event = AttendanceEvent(
        business_id=actor.business_id,
        employee_id=profile.id,
        created_by_id=actor.id,
        event_type=data.event_type,
        source=EventSource.manual,
        occurred_at=data.occurred_at,
        note=data.reason,
    )
    db.add(event)
    db.flush()

    audit(db,actor,"attendance.manul_added", event.id,
          {
              "employee_id": profile.id,
              "event_type": data.event_type.value,
              "occurred_at": data.occurred_at.isoformat(),
              "reason": data.reason,
          })
    db.commit()
    return event




def correct_event_time(db: Session,actor: Membership, event_id: int,data: TimeCorrection)-> AttendanceEvent:
    event = _get_event(db,actor,event_id)
    _check_can_edit(actor,event.employee)
    _check_not_future(data.occurred_at)
    _check_period_open(db,actor,event.employee,event.occurred_at)
    _check_period_open(db,actor,event.employee,data.occurred_at)

    if event.is_voided:
        raise HTTPException(status.HTTP_409_CONFLICT,"This record was voided")
    if data.occurred_at == event.occurred_at:
        raise HTTPException(status.HTTP_400_BAD_REQUEST,"The new time is the same as the current time")

    correction = AttendanceCorrection(
        business_id=actor.business_id,
        event_id=event.id,
        corrected_by_id=actor.id,
        action=CorrectionAction.change_time,
        old_occurred_at=event.occurred_at,
        new_occurred_at=data.occurred_at,
        reason=data.reason,
    )

    db.add(correction)

    event.occurred_at = data.occurred_at
    audit(db,actor,"attendance.corrected",event.id,{"reason": data.reason})
    db.commit()
    return event



def void_event(db: Session, actor: Membership,event_id: int,data: VoidRequest)-> AttendanceEvent:
    event = _get_event(db,actor,event_id)
    _check_can_edit(actor,event.employee)
    _check_period_open(db,actor,event.employee,event.occurred_at)

    if event.is_voided:
        raise HTTPException(status.HTTP_409_CONFLICT,"This record is already voided")

    correction = AttendanceCorrection(
        business_id=actor.business_id,
        event_id=event.id,
        corrected_by_id=actor.id,
        action=CorrectionAction.void,
        old_occurred_at=event.occurred_at,
        new_occurred_at=None,
        reason=data.reason,
    )


    db.add(correction)

    event.is_voided = True
    audit(db,actor,"attendance.voided",event.id,{"reason": data.reason})
    db.commit()
    return event


def list_corrections(db: Session, actor: Membership, event_id: int)-> list[AttendanceCorrection]:
    event = _get_event(db,actor,event_id)

    query = (select(AttendanceCorrection).where(AttendanceCorrection.event_id == event.id).order_by(AttendanceCorrection.created_at))
    return list(db.scalars(query).all())

