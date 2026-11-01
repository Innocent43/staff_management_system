from datetime import datetime, time
from decimal import Decimal
from types import SimpleNamespace
from zoneinfo import ZoneInfo

from app.models.enums import EventType, WageType
from app.services.shift_service import build_shifts

LAGOS = ZoneInfo("Africa/Lagos")


def lagos(day: int, hour: int, minute: int = 0) -> datetime:
    """A Lagos-time moment in October 2026. 12 Oct 2026 is a Monday."""
    return datetime(2026, 10, day, hour, minute, tzinfo=LAGOS)


def make_schedule(
    start=time(8, 0),
    end=time(17, 0),
    break_minutes=60,
    grace_minutes=10,
    workdays=(0, 1, 2, 3, 4),
):
    return SimpleNamespace(
        start_time=start,
        end_time=end,
        break_minutes=break_minutes,
        grace_minutes=grace_minutes,
        workdays=list(workdays),
    )


def make_profile(schedule=None, wage_type=WageType.hourly, wage_rate="1500.00"):
    return SimpleNamespace(
        id=1,
        wage_type=wage_type,
        wage_rate=Decimal(wage_rate),
        schedule=schedule,
        business=SimpleNamespace(timezone="Africa/Lagos"),
        membership=SimpleNamespace(user=SimpleNamespace(full_name="Chika Obi")),
    )


def make_rule(**changes):
    rule = dict(
        deduct_scheduled_break=True,
        min_minutes_for_daily_pay=240,
        overtime_enabled=False,
        overtime_after_minutes=480,
        overtime_multiplier=Decimal("1.50"),
        lateness_deduction_enabled=False,
        lateness_deduction_per_minute=Decimal("0.00"),
    )
    rule.update(changes)
    return SimpleNamespace(**rule)


def clock_in(moment):
    return SimpleNamespace(event_type=EventType.clock_in, occurred_at=moment)


def clock_out(moment):
    return SimpleNamespace(event_type=EventType.clock_out, occurred_at=moment)


def shifts_for(profile, *pairs):
    """Builds real shifts from (clock_in, clock_out) pairs."""
    events = []
    for start, end in pairs:
        events.append(clock_in(start))
        events.append(clock_out(end))
    return build_shifts(profile, events)