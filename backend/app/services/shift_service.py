
from datetime import datetime, timedelta, timezone, date
from zoneinfo import ZoneInfo

from app.models.attendance_event import AttendanceEvent
from app.models.employee_profile import EmployeeProfile
from app.models.enums import EventType
from app.schemas.attendance import ShiftOut


def scheduled_shift_date(profile: EmployeeProfile, moment: datetime) -> date:
    """
    Determine which scheduled workday an event belongs to.

    For overnight schedules, events before the scheduled end time
    belong to the previous day's shift.
    """
    local_moment = moment.astimezone(ZoneInfo(profile.business.timezone))
    schedule = profile.schedule

    if schedule is None:
        return local_moment.date()

    crosses_midnight = schedule.end_time < schedule.start_time

    if crosses_midnight and local_moment.time() < schedule.end_time:
        return local_moment.date() - timedelta(days=1)

    return local_moment.date()


def _open_shift_deadline(
    profile: EmployeeProfile,
    clock_in: datetime,
) -> datetime | None:
    """
    Calculate when an open shift should be flagged as missing_clock_out.

    Returns None when there is no schedule or the clock-in does not
    belong to one of the employee's scheduled workdays.
    """
    schedule = profile.schedule

    if schedule is None:
        return None

    shift_date = scheduled_shift_date(profile, clock_in)

    # Do not calculate a scheduled end time for an unscheduled day.
    if shift_date.weekday() not in schedule.workdays:
        return None

    crosses_midnight = schedule.end_time < schedule.start_time

    # An overnight shift ends on the following calendar day.
    end_date = shift_date + timedelta(days=1) if crosses_midnight else shift_date

    business_timezone = ZoneInfo(profile.business.timezone)

    scheduled_end = datetime.combine(
        end_date,
        schedule.end_time,
        tzinfo=business_timezone,
    )

    # The business setting controls how long after scheduled end
    # an open shift is allowed to remain before being flagged.
    return scheduled_end + timedelta(
        hours=profile.business.open_shift_extra_hours
    )


def build_shifts(
    profile: EmployeeProfile,
    events: list[AttendanceEvent],
) -> list[ShiftOut]:
    shifts = []
    open_in = None

    for event in events:
        if event.event_type == EventType.clock_in:
            if open_in is not None:
                shifts.append(
                    _make_shift(profile, open_in, None, ["missing_clock_out"])
                )

            open_in = event

        else:
            if open_in is None:
                shifts.append(
                    _make_shift(profile, None, event, ["missing_clock_in"])
                )
            else:
                shifts.append(
                    _make_shift(profile, open_in, event, [])
                )
                open_in = None

    if open_in is not None:
        deadline = _open_shift_deadline(profile, open_in.occurred_at)

        if deadline is not None and datetime.now(timezone.utc) >= deadline:
            shifts.append(
                _make_shift(profile, open_in, None, ["missing_clock_out"])
            )
        else:
            shifts.append(
                _make_shift(profile, open_in, None, ["in_progress"])
            )

    return shifts


def _make_shift(
    profile: EmployeeProfile,
    clock_in_event: AttendanceEvent | None,
    clock_out_event: AttendanceEvent | None,
    flags: list[str],
) -> ShiftOut:
    clock_in = clock_in_event.occurred_at if clock_in_event else None
    clock_out = clock_out_event.occurred_at if clock_out_event else None

    duration_minutes = 0

    if clock_in and clock_out:
        duration_minutes = int(
            (clock_out - clock_in).total_seconds() // 60
        )

    late_minutes = _late_minutes(profile, clock_in) if clock_in else 0

    return ShiftOut(
        employee_id=profile.id,
        employee_name=profile.membership.user.full_name,
        clock_in=clock_in,
        clock_out=clock_out,
        duration_minutes=duration_minutes,
        late_minutes=late_minutes,
        flags=flags,
    )


def _late_minutes(
    profile: EmployeeProfile,
    clock_in: datetime,
) -> int:
    schedule = profile.schedule

    if schedule is None:
        return 0

    shift_date = scheduled_shift_date(profile, clock_in)

    if shift_date.weekday() not in schedule.workdays:
        return 0

    local_time = clock_in.astimezone(
        ZoneInfo(profile.business.timezone)
    )

    expected_start = datetime.combine(
        shift_date,
        schedule.start_time,
        tzinfo=local_time.tzinfo,
    )

    minutes_late = int(
        (local_time - expected_start).total_seconds() // 60
    )

    if minutes_late > schedule.grace_minutes:
        return minutes_late

    return 0
