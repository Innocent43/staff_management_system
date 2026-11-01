import pytest

from tests.helpers import (
    add_manual_event,
    at,
    auth,
    clock,
    create_workplace,
    find_employee_id,
    get_qr_token,
    last_monday,
    register_business,
)


@pytest.fixture
def other_owner(client):
    return register_business(client, name="Other Shop", email="owner-b@example.com")


def test_another_business_cannot_see_or_change_my_employees(client, team, other_owner):
    url = f"/employees/{team.employee_id}"

    assert client.get(url, headers=auth(other_owner)).status_code == 404
    assert client.patch(url, headers=auth(other_owner), json={"staff_code": "X1"}).status_code == 404
    assert client.post(f"{url}/deactivate", headers=auth(other_owner)).status_code == 404

    names = [row["user"]["full_name"] for row in client.get("/employees", headers=auth(other_owner)).json()]
    assert "Chika Obi" not in names


def test_another_business_cannot_use_my_schedule(client, team, other_owner):
    schedule = client.post(
        "/schedules",
        headers=auth(team.owner),
        json={"name": "Day shift", "start_time": "08:00:00", "end_time": "17:00:00", "workdays": [0, 1]},
    )
    assert schedule.status_code == 201, schedule.text
    schedule_id = schedule.json()["id"]
    their_owner_id = find_employee_id(client, other_owner, "owner-b@example.com")

    assert client.get("/schedules", headers=auth(other_owner)).json() == []
    assert client.patch(f"/schedules/{schedule_id}", headers=auth(other_owner), json={"name": "Hacked"}).status_code == 404
    assert client.patch(
        f"/employees/{their_owner_id}", headers=auth(other_owner), json={"schedule_id": schedule_id}
    ).status_code == 404


def test_another_business_cannot_reach_my_attendance(client, team, other_owner):
    event = add_manual_event(client, team.owner, team.employee_id, "clock_in", at(last_monday(), 8))

    assert client.get("/attendance", headers=auth(other_owner)).json() == []
    assert client.get(f"/attendance/{event['id']}/corrections", headers=auth(other_owner)).status_code == 404
    assert client.patch(
        f"/attendance/{event['id']}",
        headers=auth(other_owner),
        json={"occurred_at": at(last_monday(), 9), "reason": "Trying my luck"},
    ).status_code == 404
    assert client.post(
        "/attendance/manual",
        headers=auth(other_owner),
        json={
            "employee_id": team.employee_id,
            "event_type": "clock_out",
            "occurred_at": at(last_monday(), 17),
            "reason": "Trying my luck",
        },
    ).status_code == 404


def test_a_qr_code_from_another_business_does_not_work(client, team, other_owner):
    their_workplace = create_workplace(client, other_owner, name="Their gate")
    their_qr = get_qr_token(client, other_owner, their_workplace)

    response = clock(client, team.employee, their_qr, "clock_in", "request-0001")

    assert response.status_code == 400


def test_another_business_cannot_see_my_tasks_or_assign_my_people(client, team, other_owner):
    task = client.post(
        "/tasks", headers=auth(team.owner), json={"title": "Clean the ovens", "assignee_ids": [team.employee_id]}
    ).json()

    assert client.get(f"/tasks/{task['id']}", headers=auth(other_owner)).status_code == 404
    assert client.delete(f"/tasks/{task['id']}", headers=auth(other_owner)).status_code == 404
    assert client.post(
        "/tasks", headers=auth(other_owner), json={"title": "Sneaky task", "assignee_ids": [team.employee_id]}
    ).status_code == 400


def test_another_business_cannot_see_my_pay_summaries(client, team, other_owner):
    monday = last_monday()
    period = {"period_start": monday.isoformat(), "period_end": monday.isoformat()}
    result = client.post("/pay-summaries/generate", headers=auth(team.owner), json=period).json()
    summary_id = result["summaries"][0]["id"]

    assert client.get(f"/pay-summaries/{summary_id}", headers=auth(other_owner)).status_code == 404
    assert client.get("/pay-summaries", headers=auth(other_owner)).json() == []