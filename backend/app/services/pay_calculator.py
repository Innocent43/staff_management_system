from collections import defaultdict
from decimal import ROUND_HALF_UP,Decimal
from zoneinfo import ZoneInfo

from app.models.employee_profile import EmployeeProfile
from app.models.enums import WageType
from app.models.wage_rule import WageRule
from app.schemas.attendance import ShiftOut
from app.schemas.pay import PayFigures


CENTS = Decimal("0.01")

def _money(value: Decimal)->Decimal:
    return value.quantize(CENTS,rounding=ROUND_HALF_UP)


def calculate_pay(profile: EmployeeProfile,rule: WageRule, shifts: list[ShiftOut])->PayFigures:
    local_zone = ZoneInfo(profile.business.timezone)
    break_minutes = profile.schedule.break_minutes if profile.schedule else 0

    minutes_by_day = defaultdict(int)
    late_minutes = 0
    incomplete_days = 0

    for shift in shifts:
        late_minutes += shift.late_minutes

        if shift.clock_in is None or shift.clock_out is None:
            incomplete_days += 1
            continue

        worked = shift.duration_minutes
        if rule.deduct_scheduled_break and worked > break_minutes:
            worked -= break_minutes

        day = shift.clock_in.astimezone(local_zone).date()
        minutes_by_day[day] += worked

    worked_minutes = sum(minutes_by_day.values())
    days_present = sum(1 for minutes in minutes_by_day.values() if minutes > 0)
    paid_days = sum(1 for minutes in minutes_by_day.values() if minutes >= rule.min_minutes_for_daily_pay)

    overtime_minutes = 0
    if profile.wage_type == WageType.hourly and rule.overtime_enabled:
        overtime_minutes = sum(max(0, minutes - rule.overtime_after_minutes) for minutes in minutes_by_day.values())

    rate = profile.wage_rate
    overtime_pay = Decimal("0")

    if profile.wage_type == WageType.hourly:
        regular_minutes = worked_minutes - overtime_minutes
        base_pay = rate * regular_minutes / 60
        overtime_pay = rate * rule.overtime_multiplier * overtime_minutes / 60
    elif profile.wage_type == WageType.daily:
        base_pay = rate * paid_days
    else:
        base_pay = rate

    lateness_deduction = Decimal("0")
    if rule.lateness_deduction_enabled:
        lateness_deduction = rule.lateness_deduction_per_minute * late_minutes

    gross = max(Decimal("0"), base_pay + overtime_pay - lateness_deduction)

    return PayFigures(
        worked_minutes=worked_minutes,
        overtime_minutes=overtime_minutes,
        late_minutes=late_minutes,
        days_present=days_present,
        incomplete_days=incomplete_days,
        gross_estimate=_money(gross),
        calculation_details={
            "wage_type": profile.wage_type.value,
            "wage_rate": str(rate),
            "schedule_break_minutes": break_minutes,
            "paid_days": paid_days,
            "base_pay": str(_money(base_pay)),
            "overtime_pay": str(_money(overtime_pay)),
            "lateness_deduction": str(_money(lateness_deduction)),
            "rules": {
                "deduct_scheduled_break": rule.deduct_scheduled_break,
                "min_minutes_for_daily_pay": rule.min_minutes_for_daily_pay,
                "overtime_enabled": rule.overtime_enabled,
                "overtime_after_minutes": rule.overtime_after_minutes,
                "overtime_multiplier": str(rule.overtime_multiplier),
                "lateness_deduction_enabled": rule.lateness_deduction_enabled,
                "lateness_deduction_per_minute":str(rule.lateness_deduction_per_minute),
            }
        }

    )