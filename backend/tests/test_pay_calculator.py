from decimal import Decimal

from app.models.enums import WageType
from app.services.pay_calculator import calculate_pay
from app.services.shift_service import build_shifts
from tests.factories import (
    clock_in,
    lagos,
    make_profile,
    make_rule,
    make_schedule,
    shifts_for,
)


def full_week(profile, end_hour=17):
    """Monday 12 to Friday 16 October, 08:00 to end_hour."""
    return shifts_for(profile, *[(lagos(day, 8), lagos(day, end_hour)) for day in range(12, 17)])


def test_hourly_pay_after_the_scheduled_break():
    profile = make_profile(make_schedule(break_minutes=60), WageType.hourly, "1500.00")

    figures = calculate_pay(profile, make_rule(), full_week(profile))

    assert figures.worked_minutes == 2400
    assert figures.gross_estimate == Decimal("60000.00")
    assert figures.days_present == 5


def test_break_is_not_deducted_when_the_owner_switches_it_off():
    profile = make_profile(make_schedule(break_minutes=60), WageType.hourly, "1500.00")

    figures = calculate_pay(profile, make_rule(deduct_scheduled_break=False), full_week(profile))

    assert figures.worked_minutes == 2700


def test_break_is_not_deducted_from_a_shift_shorter_than_the_break():
    profile = make_profile(make_schedule(break_minutes=60), WageType.hourly, "1000.00")
    shifts = shifts_for(profile, (lagos(12, 8), lagos(12, 9)))

    figures = calculate_pay(profile, make_rule(), shifts)

    assert figures.worked_minutes == 60


def test_overtime_is_paid_at_the_multiplier_for_hourly_staff():
    profile = make_profile(make_schedule(break_minutes=60), WageType.hourly, "1500.00")
    shifts = shifts_for(profile, (lagos(12, 8), lagos(12, 18)))  # 540 minutes after the break

    figures = calculate_pay(profile, make_rule(overtime_enabled=True), shifts)

    assert figures.overtime_minutes == 60
    assert figures.gross_estimate == Decimal("14250.00")  # 8h x 1500 + 1h x 1500 x 1.5


def test_overtime_is_off_by_default():
    profile = make_profile(make_schedule(break_minutes=60), WageType.hourly, "1500.00")
    shifts = shifts_for(profile, (lagos(12, 8), lagos(12, 18)))

    figures = calculate_pay(profile, make_rule(), shifts)

    assert figures.overtime_minutes == 0
    assert figures.gross_estimate == Decimal("13500.00")


def test_daily_wage_pays_only_days_that_reach_the_minimum():
    profile = make_profile(make_schedule(break_minutes=0), WageType.daily, "5000.00")
    shifts = shifts_for(
        profile,
        (lagos(12, 8), lagos(12, 11)),  # 3 hours: not a paid day
        (lagos(13, 8), lagos(13, 16)),  # 8 hours: paid day
    )

    figures = calculate_pay(profile, make_rule(), shifts)

    assert figures.days_present == 2
    assert figures.gross_estimate == Decimal("5000.00")


def test_fixed_wage_is_the_same_whatever_the_attendance():
    profile = make_profile(make_schedule(), WageType.fixed, "100000.00")

    figures = calculate_pay(profile, make_rule(), [])

    assert figures.gross_estimate == Decimal("100000.00")


def test_lateness_is_never_deducted_unless_switched_on():
    profile = make_profile(make_schedule(), WageType.fixed, "100000.00")
    shifts = shifts_for(profile, (lagos(12, 8, 40), lagos(12, 17)))  # 40 minutes late

    figures = calculate_pay(profile, make_rule(), shifts)

    assert figures.late_minutes == 40
    assert figures.gross_estimate == Decimal("100000.00")


def test_lateness_deduction_when_switched_on():
    profile = make_profile(make_schedule(), WageType.fixed, "100000.00")
    shifts = shifts_for(profile, (lagos(12, 8, 40), lagos(12, 17)))
    rule = make_rule(lateness_deduction_enabled=True, lateness_deduction_per_minute=Decimal("50.00"))

    figures = calculate_pay(profile, rule, shifts)

    assert figures.gross_estimate == Decimal("98000.00")


def test_pay_never_goes_below_zero():
    profile = make_profile(make_schedule(), WageType.hourly, "100.00")
    shifts = shifts_for(profile, (lagos(12, 9), lagos(12, 17)))  # 60 minutes late
    rule = make_rule(lateness_deduction_enabled=True, lateness_deduction_per_minute=Decimal("500.00"))

    figures = calculate_pay(profile, rule, shifts)

    assert figures.gross_estimate == Decimal("0.00")


def test_incomplete_shift_is_counted_but_never_paid():
    profile = make_profile(make_schedule(break_minutes=60), WageType.hourly, "1000.00")
    events = [clock_in(lagos(12, 8)), clock_in(lagos(13, 8))]  # the 12th was never clocked out
    shifts = build_shifts(profile, events)

    figures = calculate_pay(profile, make_rule(), shifts)

    assert figures.incomplete_days == 2
    assert figures.worked_minutes == 0
    assert figures.gross_estimate == Decimal("0.00")


def test_money_is_rounded_half_up_to_two_decimals():
    profile = make_profile(make_schedule(break_minutes=0), WageType.hourly, "167.30")
    shifts = shifts_for(profile, (lagos(12, 8), lagos(12, 8, 3)))  # 3 minutes

    figures = calculate_pay(profile, make_rule(), shifts)

    # 167.30 x 3 / 60 = 8.365 exactly. Half-up gives 8.37 (Python's default would give 8.36)
    assert figures.gross_estimate == Decimal("8.37")


def test_the_rules_used_are_saved_in_the_details():
    profile = make_profile(make_schedule(), WageType.hourly, "1500.00")

    figures = calculate_pay(profile, make_rule(overtime_enabled=True), full_week(profile))

    assert figures.calculation_details["wage_rate"] == "1500.00"
    assert figures.calculation_details["rules"]["overtime_enabled"] is True