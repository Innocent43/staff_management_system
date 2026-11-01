from datetime import datetime,timedelta,timezone
from zoneinfo import ZoneInfo

from app.models.attendance_event import AttendanceEvent
from app.models.employee_profile import EmployeeProfile
from app.models.enums import EventType
from app.schemas.attendance import ShiftOut

MAX_OPEN_SHIFT_HOURS = 16

def build_shifts(profile: EmployeeProfile,events: list[AttendanceEvent])->list[ShiftOut]:
    shifts = []
    open_in = None

    for event in events:
        if event.event_type == EventType.clock_in:
            if open_in is not None:
                shifts.append(_make_shift(profile,open_in,None,["missing_clock_out"]))

            open_in = event 
        else:
            if open_in is None:
                shifts.append(_make_shift(profile,None,event,["missing_clock_in"]))
            else:
                shifts.append(_make_shift(profile,open_in,event,[]))
                open_in = None

    if open_in is not None:
        age = datetime.now(timezone.utc) - open_in.occurred_at
        if age >= timedelta(hours=MAX_OPEN_SHIFT_HOURS):
            shifts.append(_make_shift(profile,open_in,None,["missing_clock_out"]))
        else:
            shifts.append(_make_shift(profile,open_in,None,["in_progress"]))

    return shifts








def _make_shift(profile: EmployeeProfile,clock_in_event: AttendanceEvent | None,clock_out_event: AttendanceEvent | None, flags: list[str])->ShiftOut:
    clock_in = clock_in_event.occurred_at if clock_in_event else None
    clock_out = clock_out_event.occurred_at if clock_out_event else None

    duration_minutes = 0
    if clock_in and clock_out:
        duration_minutes=int((clock_out - clock_in).total_seconds() // 60)


    late_minutes = _late_minutes(profile,clock_in) if clock_in else 0


    return ShiftOut(employee_id=profile.id,employee_name=profile.membership.user.full_name,
                    clock_in=clock_in,clock_out=clock_out,duration_minutes=duration_minutes,late_minutes=late_minutes,flags=flags)





def _late_minutes(profile: EmployeeProfile,clock_in: datetime)->int:
    schedule = profile.schedule
    if schedule is None:
        return 0

    local_time = clock_in.astimezone(ZoneInfo(profile.business.timezone))
    start_date = local_time.date()


    crosses_midnight = schedule.end_time < schedule.start_time

    if crosses_midnight and local_time.time() < schedule.end_time:
        start_date = start_date - timedelta(days=1)

    if start_date.weekday() not in schedule.workdays:
        return 0

    expected_start = datetime.combine(start_date,schedule.start_time,tzinfo=local_time.tzinfo)

    minutes_late = int((local_time - expected_start).total_seconds() // 60)

    if minutes_late > schedule.grace_minutes:
        return minutes_late
    return 0



