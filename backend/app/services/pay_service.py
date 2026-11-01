from collections import defaultdict
from datetime import datetime,date,timezone,timedelta

from fastapi import HTTPException,status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session,selectinload

from app.core.timezone import local_date,local_day_end,local_day_start

from app.models.attendance_event import AttendanceEvent
from app.models.employee_profile import EmployeeProfile
from app.models.enums import MembershipStatus,PayStatus,Role
from app.models.membership import Membership
from app.models.pay_summary import PaySummary
from app.models.wage_rule import WageRule

from app.schemas.pay import (
    PayAdjustment,PayFigures,PayGenerateOut,PayGenerateRequest,PaySummaryFilters,PaySummaryListFilters,
)

from app.services.audit_service import audit
from app.services.pay_calculator import calculate_pay
from app.services.shift_service import build_shifts
from app.services.wage_rule_service import get_wage_rule




def _load_employee():
    return (
        selectinload(PaySummary.employee).selectinload(EmployeeProfile.membership).selectinload(Membership.user)
    )



def _find_profiles(db: Session,actor: Membership,employee_id: int | None)->list[EmployeeProfile]:
    query = (select(EmployeeProfile).join(EmployeeProfile.membership).where(EmployeeProfile.business_id == actor.business_id).options(selectinload(EmployeeProfile.membership).selectinload(Membership.user),selectinload(EmployeeProfile.schedule),selectinload(EmployeeProfile.business),))

    if employee_id:
        query = query.where(EmployeeProfile.id == employee_id,Membership.status != MembershipStatus.invited,)
    else:
        query = query.where(Membership.status == MembershipStatus.active)

    if actor.role != Role.owner:
        query = query.where(Membership.role == Role.employee)

    profiles = list(db.scalars(query).all())
    if employee_id and not profiles:
        raise HTTPException(status.HTTP_404_NOT_FOUND,"Employee not found")
    return profiles


def _load_events(db: Session, actor: Membership, employee_ids: list[int], start: date,end:date)-> dict[int, list[AttendanceEvent]]:
    timezone_name = actor.business.timezone
    query = (select(AttendanceEvent).where(AttendanceEvent.business_id == actor.business_id,AttendanceEvent.employee_id.in_(employee_ids),AttendanceEvent.is_voided.is_(False),AttendanceEvent.occurred_at >= local_day_start(start,timezone_name) - timedelta(days=1),AttendanceEvent.occurred_at < local_day_end(end,timezone_name) + timedelta(days=1),).order_by(AttendanceEvent.occurred_at))

    event_by_employee = defaultdict(list)

    for event in db.scalars(query):
        event_by_employee[event.employee_id].append(event)
    return event_by_employee



def _calculate(profile: EmployeeProfile,rule: WageRule,events: list[AttendanceEvent], start: date,end: date,)->PayFigures:
    timezone_name = profile.business.timezone
    shifts = [shift for shift in build_shifts(profile,events) if start <= local_date(shift.clock_in or shift.clock_out, timezone_name) <= end]
    return calculate_pay(profile,rule,shifts)




def _approved_overlaps(db: Session, actor: Membership, employee_ids: list[int], start: date,end: date)->set[int]:
    query = select(PaySummary.employee_id).where(PaySummary.business_id == actor.business_id,PaySummary.employee_id.in_(employee_ids),PaySummary.status == PayStatus.approved,PaySummary.period_start <= end,PaySummary.period_end >= start,)

    return set(db.scalars(query).all())



def _reload(db: Session,summary_ids: list[int])->list[PaySummary]:
    query = (select(PaySummary).where(PaySummary.id.in_(summary_ids)).options(_load_employee()).order_by(PaySummary.id))
    return list(db.scalars(query).all())


def generate_summaries(db: Session,actor: Membership,data: PayGenerateRequest)->PayGenerateOut:
    rule = get_wage_rule(db,actor)
    profiles = _find_profiles(db,actor,data.employee_id)
    profile_ids = [profile.id for profile in profiles]

    events_by_employee = _load_events(db,actor,profile_ids,data.period_start,data.period_end)
    locked_ids = _approved_overlaps(db,actor,profile_ids,data.period_start,data.period_end)

    drafts = {summary.employee_id: summary for summary in db.scalars(select(PaySummary).where(PaySummary.business_id == actor.business_id,PaySummary.employee_id.in_(profile_ids),PaySummary.period_start == data.period_start,PaySummary.period_end == data.period_end,))}

    summaries = []
    skipped = []

    for profile in profiles:
        if profile.id in locked_ids:
            name = profile.membership.user.full_name
            skipped.append(f"{name}: this period overlaps an approved pay summary")
            continue

        events = events_by_employee.get(profile.id,[])
        figures = _calculate(profile,rule,events,data.period_start,data.period_end)

        summary = drafts.get(profile.id)
        if summary is None:
            summary = PaySummary(
                business_id=actor.business_id,
                employee=profile,
                period_start=data.period_start,
                period_end=data.period_end,
            )
            db.add(summary)

        for field,value in figures.model_dump().items():
            setattr(summary,field,value)
        summaries.append(summary)

    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT,"This summaries are being generated by another request. Try again.")

    summary_ids = [summary.id for summary in summaries]
    audit(db,actor,"pay.generated",None,{
        "period_start": data.period_start.isoformat(),
        "period_end": data.period_end.isoformat(),
        "count": len(summaries),
    })

    db.commit()

    return PayGenerateOut(summaries=_reload(db,summary_ids),skipped=skipped)




def _build_query(actor: Membership,filters: PaySummaryFilters):
    query = (select(PaySummary).join(PaySummary.employee).join(EmployeeProfile.membership).where(PaySummary.business_id == actor.business_id).options(_load_employee()))

    if actor.role != Role.owner:
        query = query.where(Membership.role == Role.employee)
    if filters.employee_id:
        query = query.where(PaySummary.employee_id == filters.employee_id)
    if filters.status:
        query = query.where(PaySummary.status == filters.status)
    if filters.date_from:
        query = query.where(PaySummary.period_end >= filters.date_from)
    if filters.date_to:
        query = query.where(PaySummary.period_start <= filters.date_to)

    return query.order_by(PaySummary.period_start.desc(),PaySummary.id)



def list_summaries(db: Session, actor: Membership,filters: PaySummaryListFilters)->list[PaySummary]:
    query = _build_query(actor,filters).limit(filters.limit).offset(filters.offset)
    return list(db.scalars(query).all())


def list_all_summaries(db: Session, actor: Membership,filters: PaySummaryFilters)->list[PaySummary]:
    return list(db.scalars(_build_query(actor,filters)).all())



def get_summary(db: Session, actor: Membership, summary_id: int)-> PaySummary:
    summary = db.scalar(select(PaySummary).where(PaySummary.id == summary_id,PaySummary.business_id == actor.business_id).options(_load_employee()))

    is_hidden = (summary is not None and actor.role != Role.owner and summary.employee.membership.role != Role.employee)

    if summary is None or is_hidden:
        raise HTTPException(status.HTTP_404_NOT_FOUND,"Pay summary not found")
    return summary



def adjust_summary(db: Session,actor: Membership,summary_id: int,data:PayAdjustment)->PaySummary:
    summary = get_summary(db,actor,summary_id)

    if summary.status == PayStatus.approved:
        raise HTTPException(status.HTTP_409_CONFLICT,"An approved summary cannot be changed")
    if summary.gross_estimate + data.adjustments < 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST,"The adjustment would make the total negative")

    summary.adjustments = data.adjustments
    summary.adjustment_note = data.adjustment_note
    audit(db,actor,"pay.adjusted",summary.id,{"adjustments": str(data.adjustments), "note": data.adjustment_note},)

    db.commit()
    return summary


def _has_changed(summary: PaySummary,figures: PayFigures)->bool:
    return (
        summary.worked_minutes != figures.worked_minutes or summary.overtime_minutes != figures.overtime_minutes or summary.late_minutes != figures.late_minutes or summary.incomplete_days != figures.incomplete_days or summary.gross_estimate != figures.gross_estimate
    )




def approve_summary(db: Session,actor: Membership,summary_id: int)->PaySummary:
    summary = get_summary(db,actor,summary_id)

    if summary.status == PayStatus.approved:
        raise HTTPException(status.HTTP_409_CONFLICT,"This summary is already approved")

    today = local_date(datetime.now(timezone.utc),actor.business.timezone)
    if summary.period_end >= today:
        raise HTTPException(status.HTTP_409_CONFLICT,"The pay period has not ended yet")

    overlaps = _approved_overlaps(db,actor,[summary.employee_id],summary.period_start,summary.period_end)

    if overlaps:
        raise HTTPException(status.HTTP_409_CONFLICT,"This period overlaps another approved summary for this employee",)

    rule = get_wage_rule(db,actor)
    events = _load_events(db,actor,[summary.employee_id],summary.period_start,summary.period_end)

    figures = _calculate(summary.employee,rule,events.get(summary.employee_id,[]),summary.period_start,summary.period_end,)

    if _has_changed(summary,figures):
        raise HTTPException(status.HTTP_409_CONFLICT,"Attendance or pay settings changed since this draft was made." "Regenerate it and review the new figures.",)

    summary.calculation_details = figures.calculation_details
    summary.status = PayStatus.approved
    summary.approved_by_id = actor.id
    summary.approved_at = datetime.now(timezone.utc)
    audit(db,actor,"pay.approved",summary.id,{
        "gross_estimate": str(summary.gross_estimate),
        "adjustments": str(summary.adjustments),
        "incomplete_days": summary.incomplete_days,
    })

    db.commit()
    return summary



