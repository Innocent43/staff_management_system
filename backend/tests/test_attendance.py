from datetime import datetime, timedelta, timezone

from tests.helpers import (
    add_manual_event,
    at,
    auth,
    clock,
    create_workplace,
    get_qr_token,
    last_monday,
    register_business,
)


def test_clock_in_then_clock_out(client, team):
    qr = get_qr_token(client, team.owner, team.workplace_id)

    first = clock(client, team.employee, qr, "clock_in", "request-0001")
    status_in = client.get("/attendance/me/status", headers=auth(team.employee)).json()
    second = clock(client, team.employee, qr, "clock_out", "request-0002")
    status_out = client.get("/attendance/me/status", headers=auth(team.employee)).json()

    assert first.status_code == 201
    assert status_in["clocked_in"] is True
    assert second.status_code == 201
    assert status_out["clocked_in"] is False


def test_cannot_clock_in_twice_in_a_row(client, team):
    qr = get_qr_token(client, team.owner, team.workplace_id)
    clock(client, team.employee, qr, "clock_in", "request-0001")

    response = clock(client, team.employee, qr, "clock_in", "request-0002")

    assert response.status_code == 409


def test_cannot_clock_out_when_not_clocked_in(client, team):
    qr = get_qr_token(client, team.owner, team.workplace_id)

    response = clock(client, team.employee, qr, "clock_out", "request-0001")

    assert response.status_code == 409


def test_a_retry_with_the_same_request_id_creates_no_second_event(client, team):
    qr = get_qr_token(client, team.owner, team.workplace_id)

    first = clock(client, team.employee, qr, "clock_in", "request-0001")
    retry = clock(client, team.employee, qr, "clock_in", "request-0001")

    assert retry.status_code == 201
    assert retry.json()["id"] == first.json()["id"]
    history = client.get("/attendance/me", headers=auth(team.employee)).json()
    assert len(history) == 1


def test_a_retry_still_works_after_the_qr_code_expired(client, team):
    qr = get_qr_token(client, team.owner, team.workplace_id)
    first = clock(client, team.employee, qr, "clock_in", "request-0001")

    retry = clock(client, team.employee, "this-code-has-expired", "clock_in", "request-0001")

    assert retry.status_code == 201
    assert retry.json()["id"] == first.json()["id"]


def test_an_expired_qr_code_is_rejected(client, team, monkeypatch):
    monkeypatch.setattr("app.security.qr_tokens.QR_TOKEN_SECONDS", -10)
    expired = get_qr_token(client, team.owner, team.workplace_id)

    response = clock(client, team.employee, expired, "clock_in", "request-0001")

    assert response.status_code == 400


def test_regenerating_the_workplace_kills_old_qr_codes(client, team):
    old_qr = get_qr_token(client, team.owner, team.workplace_id)

    regenerate = client.post(f"/workplaces/{team.workplace_id}/regenerate", headers=auth(team.owner))
    new_qr = get_qr_token(client, team.owner, team.workplace_id)

    assert regenerate.status_code == 200
    assert clock(client, team.employee, old_qr, "clock_in", "request-0001").status_code == 400
    assert clock(client, team.employee, new_qr, "clock_in", "request-0002").status_code == 201


def test_a_switched_off_workplace_rejects_scans(client, team):
    qr = get_qr_token(client, team.owner, team.workplace_id)

    client.patch(f"/workplaces/{team.workplace_id}", headers=auth(team.owner), json={"active": False})

    assert clock(client, team.employee, qr, "clock_in", "request-0001").status_code == 400
    qr_response = client.get(f"/workplaces/{team.workplace_id}/qr", headers=auth(team.owner))
    assert qr_response.status_code == 409


def test_garbage_and_login_tokens_are_not_qr_codes(client, team):
    assert clock(client, team.employee, "abc", "clock_in", "request-0001").status_code == 400
    assert clock(client, team.employee, team.employee, "clock_in", "request-0002").status_code == 400


def test_a_forgotten_clock_out_does_not_lock_the_employee_out(client, team):
    twenty_hours_ago = (datetime.now(timezone.utc) - timedelta(hours=20)).isoformat()
    add_manual_event(client, team.owner, team.employee_id, "clock_in", twenty_hours_ago)
    qr = get_qr_token(client, team.owner, team.workplace_id)

    response = clock(client, team.employee, qr, "clock_in", "request-0001")

    assert response.status_code == 201


def test_a_manager_sees_who_is_in_today(client, team):
    qr = get_qr_token(client, team.owner, team.workplace_id)
    clock(client, team.employee, qr, "clock_in", "request-0001")

    rows = client.get("/attendance/today", headers=auth(team.owner)).json()

    chika = [row for row in rows if row["employee_name"] == "Chika Obi"][0]
    assert chika["status"] == "clocked_in"


def test_corrections_and_voids_leave_a_trail(client, team):
    day = last_monday()
    event = add_manual_event(client, team.owner, team.employee_id, "clock_in", at(day, 8))

    corrected = client.patch(
        f"/attendance/{event['id']}",
        headers=auth(team.owner),
        json={"occurred_at": at(day, 8, 30), "reason": "Supervisor confirmed arrival time"},
    )
    voided = client.post(
        f"/attendance/{event['id']}/void", headers=auth(team.owner), json={"reason": "Scanned by mistake"}
    )

    assert corrected.status_code == 200
    assert voided.status_code == 200
    assert voided.json()["is_voided"] is True

    corrections = client.get(f"/attendance/{event['id']}/corrections", headers=auth(team.owner)).json()
    assert [row["action"] for row in corrections] == ["change_time", "void"]
    assert corrections[0]["reason"] == "Supervisor confirmed arrival time"

    params = {"employee_id": team.employee_id}
    assert client.get("/attendance", headers=auth(team.owner), params=params).json() == []
    params["include_voided"] = True
    assert len(client.get("/attendance", headers=auth(team.owner), params=params).json()) == 1

    audit = client.get("/audit-logs", headers=auth(team.owner), params={"action": "attendance.corrected"})
    assert len(audit.json()) == 1


def test_a_correction_needs_a_reason_and_cannot_go_into_the_future(client, team):
    day = last_monday()
    event = add_manual_event(client, team.owner, team.employee_id, "clock_in", at(day, 8))
    url = f"/attendance/{event['id']}"
    future = (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()

    no_reason = client.patch(url, headers=auth(team.owner), json={"occurred_at": at(day, 9), "reason": "ab"})
    in_future = client.patch(url, headers=auth(team.owner), json={"occurred_at": future, "reason": "Time travel"})
    no_timezone = client.patch(
        url, headers=auth(team.owner), json={"occurred_at": f"{day.isoformat()}T09:00:00", "reason": "Forgot the zone"}
    )

    assert no_reason.status_code == 422
    assert in_future.status_code == 400
    assert no_timezone.status_code == 422





def test_the_shifts_report_flags_a_clock_out_with_no_clock_in(client, team):
    day = last_monday()
    add_manual_event(client, team.owner, team.employee_id, "clock_out", at(day, 17))

    response = client.get(
        "/attendance/shifts",
        headers=auth(team.owner),
        params={"date_from": day.isoformat(), "date_to": day.isoformat()},
    )

    assert response.status_code == 200, response.text
    chika = [shift for shift in response.json() if shift["employee_name"] == "Chika Obi"][0]
    assert chika["flags"] == ["missing_clock_in"]