from datetime import datetime, time, timedelta, timezone

from app.services.shift_service import build_shifts
from tests.factories import clock_in, clock_out, lagos, make_profile, make_schedule


def test_normal_shift_has_no_flags():
    profile = make_profile(make_schedule())

    shifts = build_shifts(profile, [clock_in(lagos(12, 8)), clock_out(lagos(12, 17))])

    assert len(shifts) == 1
    assert shifts[0].flags == []
    assert shifts[0].duration_minutes == 540
    assert shifts[0].late_minutes == 0


def test_late_only_counts_after_the_grace_period():
    profile = make_profile(make_schedule(grace_minutes=10))

    def late_for(minute):
        return build_shifts(profile, [clock_in(lagos(12, 8, minute))])[0].late_minutes

    assert late_for(0) == 0
    assert late_for(10) == 0
    assert late_for(11) == 11
    assert late_for(25) == 25


def test_arriving_early_is_not_late():
    profile = make_profile(make_schedule())

    shifts = build_shifts(profile, [clock_in(lagos(12, 7, 30))])

    assert shifts[0].late_minutes == 0


def test_no_lateness_on_a_day_off():
    profile = make_profile(make_schedule(workdays=(0, 1, 2, 3, 4)))

    saturday = build_shifts(profile, [clock_in(lagos(17, 9, 30))])

    assert saturday[0].late_minutes == 0


def test_no_schedule_means_never_late():
    profile = make_profile(schedule=None)

    shifts = build_shifts(profile, [clock_in(lagos(12, 11))])

    assert shifts[0].late_minutes == 0


def test_overnight_shift_is_paired_across_midnight():
    night = make_schedule(start=time(22, 0), end=time(6, 0), workdays=(0, 1, 2, 3, 4))
    profile = make_profile(night)

    shifts = build_shifts(profile, [clock_in(lagos(16, 22, 20)), clock_out(lagos(17, 6, 5))])

    assert len(shifts) == 1
    assert shifts[0].duration_minutes == 465
    assert shifts[0].late_minutes == 20


def test_overnight_clock_in_after_midnight_counts_against_the_previous_day():
    night = make_schedule(start=time(22, 0), end=time(6, 0), workdays=(0, 1, 2, 3, 4))
    profile = make_profile(night)

    # 00:30 on Saturday belongs to Friday's shift that started at 22:00
    shifts = build_shifts(profile, [clock_in(lagos(17, 0, 30))])

    assert shifts[0].late_minutes == 150


def test_overnight_shift_starting_on_a_day_off_is_not_late():
    night = make_schedule(start=time(22, 0), end=time(6, 0), workdays=(0, 1, 2, 3, 4))
    profile = make_profile(night)

    saturday_night = build_shifts(profile, [clock_in(lagos(17, 22, 30))])

    assert saturday_night[0].late_minutes == 0


def test_two_clock_ins_in_a_row_flag_the_first_as_missing_clock_out():
    profile = make_profile(make_schedule())
    events = [clock_in(lagos(12, 8)), clock_in(lagos(13, 8)), clock_out(lagos(13, 17))]

    shifts = build_shifts(profile, events)

    assert len(shifts) == 2
    assert shifts[0].flags == ["missing_clock_out"]
    assert shifts[0].clock_out is None
    assert shifts[1].flags == []


def test_clock_out_without_clock_in_is_flagged():
    profile = make_profile(make_schedule())

    shifts = build_shifts(profile, [clock_out(lagos(12, 17))])

    assert shifts[0].flags == ["missing_clock_in"]
    assert shifts[0].clock_in is None
    assert shifts[0].duration_minutes == 0


def test_recent_clock_in_is_in_progress():
    profile = make_profile(make_schedule())
    two_hours_ago = datetime.now(timezone.utc) - timedelta(hours=2)

    shifts = build_shifts(profile, [clock_in(two_hours_ago)])

    assert shifts[0].flags == ["in_progress"]


def test_clock_in_older_than_16_hours_counts_as_forgotten():
    profile = make_profile(make_schedule())
    twenty_hours_ago = datetime.now(timezone.utc) - timedelta(hours=20)

    shifts = build_shifts(profile, [clock_in(twenty_hours_ago)])

    assert shifts[0].flags == ["missing_clock_out"]