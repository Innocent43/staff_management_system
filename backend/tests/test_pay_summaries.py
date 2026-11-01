from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import pytest

from tests.helpers import add_manual_event, add_member, at, auth, last_monday


@pytest.fixture
def worked_week(client, team):
    """Chika is paid 1500 an hour and worked Monday to Friday, 08:00 to 17:00, last week."""
    schedule = client.post(
        "/schedules",
        headers=auth(team.owner),
        json={
            "name": "Day shift",
            "start_time": "08:00:00",
            "end_time": "17:00:00",
            "break_minutes": 60,
            "grace_minutes": 10,
            "workdays": [0, 1, 2, 3, 4],
        },
    )
    assert schedule.status_code == 201, schedule.text

    update = client.patch(
        f"/employees/{team.employee_id}",
        headers=auth(team.owner),
        json={"schedule_id": schedule.json()["id"], "wage_type": "hourly", "wage_rate": "1500.00"},
    )
    assert update.status_code == 200, update.text

    monday = last_monday()
    for offset in range(5):
        day = monday + timedelta(days=offset)
        add_manual_event(client, team.owner, team.employee_id, "clock_in", at(day, 8))
        add_manual_event(client, team.owner, team.employee_id, "clock_out", at(day, 17))

    return {
        "period_start": monday.isoformat(),
        "period_end": (monday + timedelta(days=6)).isoformat(),
    }


def generate(client, token, period):
    response = client.post("/pay-summaries/generate", headers=auth(token), json=period)
    assert response.status_code == 200, response.text
    return response.json()


def summary_of(result, name):
    return [summary for summary in result["summaries"] if summary["employee_name"] == name][0]


def test_a_draft_is_calculated_from_attendance(client, team, worked_week):
    result = generate(client, team.owner, worked_week)

    chika = summary_of(result, "Chika Obi")
    assert chika["status"] == "draft"
    assert chika["worked_minutes"] == 2400
    assert chika["gross_estimate"] == "60000.00"
    assert chika["net_estimate"] == "60000.00"
    assert chika["calculation_details"]["wage_rate"] == "1500.00"


def test_regenerating_a_draft_keeps_the_managers_adjustment(client, team, worked_week):
    chika = summary_of(generate(client, team.owner, worked_week), "Chika Obi")
    adjust = client.patch(
        f"/pay-summaries/{chika['id']}/adjust",
        headers=auth(team.owner),
        json={"adjustments": "2000.00", "adjustment_note": "Transport allowance"},
    )
    assert adjust.status_code == 200
    assert adjust.json()["net_estimate"] == "62000.00"

    again = summary_of(generate(client, team.owner, worked_week), "Chika Obi")

    assert again["id"] == chika["id"]
    assert again["adjustments"] == "2000.00"


def test_an_adjustment_needs_a_note_and_cannot_make_the_total_negative(client, team, worked_week):
    chika = summary_of(generate(client, team.owner, worked_week), "Chika Obi")
    url = f"/pay-summaries/{chika['id']}/adjust"

    no_note = client.patch(url, headers=auth(team.owner), json={"adjustments": "500.00"})
    too_negative = client.patch(
        url, headers=auth(team.owner), json={"adjustments": "-999999.00", "adjustment_note": "Oops"}
    )

    assert no_note.status_code == 422
    assert too_negative.status_code == 400


def test_a_period_that_has_not_ended_cannot_be_approved(client, team):
    today = datetime.now(ZoneInfo("Africa/Lagos")).date()
    start = today - timedelta(days=today.weekday())
    period = {"period_start": start.isoformat(), "period_end": (start + timedelta(days=6)).isoformat()}
    summary = summary_of(generate(client, team.owner, period), "Chika Obi")

    response = client.post(f"/pay-summaries/{summary['id']}/approve", headers=auth(team.owner))

    assert response.status_code == 409


def test_approval_is_refused_when_attendance_changed_after_the_draft(client, team, worked_week):
    chika = summary_of(generate(client, team.owner, worked_week), "Chika Obi")
    monday = last_monday()
    events = client.get(
        "/attendance",
        headers=auth(team.owner),
        params={"employee_id": team.employee_id, "date_from": monday.isoformat(), "date_to": monday.isoformat()},
    ).json()
    clock_in = [event for event in events if event["event_type"] == "clock_in"][0]
    client.patch(
        f"/attendance/{clock_in['id']}",
        headers=auth(team.owner),
        json={"occurred_at": at(monday, 8, 30), "reason": "Supervisor confirmed arrival"},
    )

    stale = client.post(f"/pay-summaries/{chika['id']}/approve", headers=auth(team.owner))
    generate(client, team.owner, worked_week)
    fresh = client.post(f"/pay-summaries/{chika['id']}/approve", headers=auth(team.owner))

    assert stale.status_code == 409
    assert fresh.status_code == 200
    assert fresh.json()["status"] == "approved"


def test_an_approved_period_is_locked(client, team, worked_week):
    chika = summary_of(generate(client, team.owner, worked_week), "Chika Obi")
    monday = last_monday()
    approve = client.post(f"/pay-summaries/{chika['id']}/approve", headers=auth(team.owner))
    assert approve.status_code == 200, approve.text
    event = client.get(
        "/attendance", headers=auth(team.owner), params={"employee_id": team.employee_id}
    ).json()[0]

    add_event = client.post(
        "/attendance/manual",
        headers=auth(team.owner),
        json={
            "employee_id": team.employee_id,
            "event_type": "clock_in",
            "occurred_at": at(monday + timedelta(days=5), 9),
            "reason": "Weekend shift",
        },
    )
    correct = client.patch(
        f"/attendance/{event['id']}",
        headers=auth(team.owner),
        json={"occurred_at": at(monday, 7, 55), "reason": "Changing history"},
    )
    void = client.post(
        f"/attendance/{event['id']}/void", headers=auth(team.owner), json={"reason": "Changing history"}
    )
    adjust = client.patch(
        f"/pay-summaries/{chika['id']}/adjust",
        headers=auth(team.owner),
        json={"adjustments": "100.00", "adjustment_note": "Too late"},
    )
    again = client.post(f"/pay-summaries/{chika['id']}/approve", headers=auth(team.owner))

    assert add_event.status_code == 409
    assert correct.status_code == 409
    assert void.status_code == 409
    assert adjust.status_code == 409
    assert again.status_code == 409


def test_an_approved_period_is_skipped_when_generating_again_or_overlapping(client, team, worked_week):
    chika = summary_of(generate(client, team.owner, worked_week), "Chika Obi")
    client.post(f"/pay-summaries/{chika['id']}/approve", headers=auth(team.owner))
    monday = last_monday()
    overlapping = {
        "period_start": (monday + timedelta(days=3)).isoformat(),
        "period_end": (monday + timedelta(days=9)).isoformat(),
    }

    same_period = generate(client, team.owner, worked_week)
    shifted_period = generate(client, team.owner, overlapping)

    for result in (same_period, shifted_period):
        assert any("Chika Obi" in message for message in result["skipped"])
        assert all(s["employee_name"] != "Chika Obi" for s in result["summaries"])


def test_approved_figures_do_not_change_when_the_wage_rate_changes(client, team, worked_week):
    chika = summary_of(generate(client, team.owner, worked_week), "Chika Obi")
    client.post(f"/pay-summaries/{chika['id']}/approve", headers=auth(team.owner))

    client.patch(f"/employees/{team.employee_id}", headers=auth(team.owner), json={"wage_rate": "2000.00"})

    saved = client.get(f"/pay-summaries/{chika['id']}", headers=auth(team.owner)).json()
    assert saved["gross_estimate"] == "60000.00"
    assert saved["calculation_details"]["wage_rate"] == "1500.00"


def test_a_manager_cannot_see_the_owners_pay(client, emails, team, worked_week):
    manager = add_member(client, emails, team.owner, "mary@example.com", role="manager", name="Mary Manager")
    owner_summary = summary_of(generate(client, team.owner, worked_week), "Owner Person")

    by_manager = generate(client, manager["token"], worked_week)
    listing = client.get("/pay-summaries", headers=auth(manager["token"])).json()
    owner_page = client.get(f"/pay-summaries/{owner_summary['id']}", headers=auth(manager["token"]))

    assert [s["employee_name"] for s in by_manager["summaries"]] == ["Chika Obi"]
    assert {s["employee_name"] for s in listing} == {"Chika Obi"}
    assert owner_page.status_code == 404


def test_csv_reports_download_and_neutralise_spreadsheet_formulas(client, emails, team, worked_week):
    add_member(client, emails, team.owner, "formula@example.com", name="=SUM(1+1)")
    generate(client, team.owner, worked_week)
    monday = last_monday()
    dates = {"date_from": monday.isoformat(), "date_to": (monday + timedelta(days=6)).isoformat()}

    pay = client.get("/reports/pay-summaries.csv", headers=auth(team.owner), params=dates)
    attendance = client.get("/reports/attendance.csv", headers=auth(team.owner), params=dates)

    assert pay.status_code == 200
    assert "text/csv" in pay.headers["content-type"]
    assert "attachment" in pay.headers["content-disposition"]
    assert "'=SUM(1+1)" in pay.text
    assert attendance.status_code == 200
    assert attendance.text.lstrip("\ufeff").startswith("Employee,Date,Clock in")
    assert "Chika Obi" in attendance.text