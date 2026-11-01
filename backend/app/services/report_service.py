import csv
import io
from datetime import datetime
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.models.membership import Membership
from app.schemas.attendance import ShiftFilters
from app.schemas.pay import PaySummaryFilters
from app.services import attendance_service,pay_service



def _safe_text(value: str)->str:
    if value and value[0] in "=+-@":
        return "'" + value
    return value


def _local_time(moment: datetime | None,zone: ZoneInfo)-> str:
    if moment is None:
        return ""
    return moment.astimezone(zone).strftime("%Y-%m-%d %H:%M")



def attendance_csv(db: Session,actor: Membership,filters: ShiftFilters)->str:
    shifts = attendance_service.list_shifts(db,actor,filters)
    zone = ZoneInfo(actor.business.timezone)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Employee","Date","Clock in","Clock out", "Duration minutes","Late minutes","Flags"])

    for shift in shifts:
        started_at = shift.clock_in or shift.clock_out
        writer.writerow(
            [
                _safe_text(shift.employee_name),
                started_at.astimezone(zone).date().isoformat(),
                _local_time(shift.clock_in,zone),
                _local_time(shift.clock_out,zone),
                shift.duration_minutes,
                shift.late_minutes,
                ", ".join(shift.flags),
            ]
        )

    return "\ufeff" + output.getvalue()



def pay_summaries_csv(db: Session,actor: Membership,filters: PaySummaryFilters)-> str:
    summaries = pay_service.list_all_summaries(db,actor,filters)
    zone = ZoneInfo(actor.business.timezone)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        ["Employee","Period start", "Period end", "Status","Worked minutes","Overtime minutes","Late minutes","Days present", "Incomplete shifts","Gross estimate", "Adjustments","Net estimate", "Adjustment note", "Approved at",]
    )

    for summary in summaries:
        writer.writerow(
            [
                _safe_text(summary.employee.membership.user.full_name),
                summary.period_start.isoformat(),
                summary.period_end.isoformat(),
                summary.status.value,
                summary.worked_minutes,
                summary.overtime_minutes,
                summary.late_minutes,
                summary.days_present,
                summary.incomplete_days,
                summary.gross_estimate,
                summary.adjustments,
                summary.gross_estimate + summary.adjustments,
                _safe_text(summary.adjustment_note or ""),
                _local_time(summary.approved_at,zone),
            ]
        )

    return "\ufeff" + output.getvalue()