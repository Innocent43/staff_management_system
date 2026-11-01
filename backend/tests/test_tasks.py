from datetime import datetime, timedelta, timezone

from sqlalchemy import text

from tests.helpers import add_member, auth, find_employee_id


def create_task(client, token, employee_ids, **changes):
    body = {"title": "Clean the ovens", "assignee_ids": employee_ids}
    body.update(changes)
    response = client.post("/tasks", headers=auth(token), json=body)
    assert response.status_code == 201, response.text
    return response.json()


def test_only_assignees_and_managers_can_see_a_task(client, emails, team):
    dayo = add_member(client, emails, team.owner, "dayo@example.com", name="Dayo Ade")
    task = create_task(client, team.owner, [team.employee_id])

    assert client.get(f"/tasks/{task['id']}", headers=auth(team.employee)).status_code == 200
    assert client.get(f"/tasks/{task['id']}", headers=auth(dayo["token"])).status_code == 404
    assert client.get("/tasks/me", headers=auth(dayo["token"])).json() == []
    assert client.get("/tasks", headers=auth(team.employee)).status_code == 403


def test_an_assignee_updates_their_own_status(client, team):
    task = create_task(client, team.owner, [team.employee_id])
    url = f"/tasks/{task['id']}/status"

    done = client.patch(url, headers=auth(team.employee), json={"status": "completed"})
    reopened = client.patch(url, headers=auth(team.employee), json={"status": "pending"})

    assert done.status_code == 200
    assert done.json()["status"] == "completed"
    assert done.json()["completed_at"] is not None
    assert reopened.json()["completed_at"] is None


def test_someone_not_assigned_cannot_change_the_status(client, emails, team):
    dayo = add_member(client, emails, team.owner, "dayo@example.com", name="Dayo Ade")
    task = create_task(client, team.owner, [team.employee_id])

    response = client.patch(
        f"/tasks/{task['id']}/status", headers=auth(dayo["token"]), json={"status": "completed"}
    )

    assert response.status_code == 404


def test_tasks_cannot_go_to_deactivated_or_unknown_employees(client, emails, team):
    dayo = add_member(client, emails, team.owner, "dayo@example.com", name="Dayo Ade")
    client.post(f"/employees/{dayo['employee_id']}/deactivate", headers=auth(team.owner))

    for ids in ([dayo["employee_id"]], [9999]):
        response = client.post(
            "/tasks", headers=auth(team.owner), json={"title": "Clean the ovens", "assignee_ids": ids}
        )
        assert response.status_code == 400


def test_changing_assignees_keeps_the_progress_of_the_people_who_stay(client, emails, team):
    dayo = add_member(client, emails, team.owner, "dayo@example.com", name="Dayo Ade")
    eze = add_member(client, emails, team.owner, "eze@example.com", name="Eze Okoro")
    task = create_task(client, team.owner, [team.employee_id, dayo["employee_id"]])
    client.patch(f"/tasks/{task['id']}/status", headers=auth(team.employee), json={"status": "in_progress"})

    response = client.patch(
        f"/tasks/{task['id']}", headers=auth(team.owner), json={"assignee_ids": [team.employee_id, eze["employee_id"]]}
    )

    assert response.status_code == 200
    status_by_person = {a["employee_name"]: a["status"] for a in response.json()["assignments"]}
    assert status_by_person == {"Chika Obi": "in_progress", "Eze Okoro": "pending"}


def test_assignment_emails_are_queued_but_not_for_assigning_yourself(client, emails, team):
    owner_id = find_employee_id(client, team.owner, "owner@example.com")

    create_task(client, team.owner, [team.employee_id, owner_id])

    task_emails = [mail for mail in emails if mail["function"] == "send_task_assigned_email"]
    assert len(task_emails) == 1
    assert task_emails[0]["args"][0] == "chika@example.com"


def test_comments_are_limited_to_the_people_on_the_task(client, emails, team):
    dayo = add_member(client, emails, team.owner, "dayo@example.com", name="Dayo Ade")
    task = create_task(client, team.owner, [team.employee_id])
    url = f"/tasks/{task['id']}/comments"

    posted = client.post(url, headers=auth(team.employee), json={"body": "I need more supplies"})
    blocked = client.post(url, headers=auth(dayo["token"]), json={"body": "Can I see this?"})
    empty = client.post(url, headers=auth(team.employee), json={"body": "   "})

    assert posted.status_code == 201
    assert blocked.status_code == 404
    assert empty.status_code == 422
    comments = client.get(url, headers=auth(team.owner)).json()
    assert [(c["author_name"], c["body"]) for c in comments] == [("Chika Obi", "I need more supplies")]


def test_deleting_a_task_removes_its_assignments_and_comments(client, team, db):
    task = create_task(client, team.owner, [team.employee_id])
    client.post(f"/tasks/{task['id']}/comments", headers=auth(team.owner), json={"body": "Please hurry"})

    response = client.delete(f"/tasks/{task['id']}", headers=auth(team.owner))

    assert response.status_code == 204
    assert db.execute(text("SELECT count(*) FROM task_assignments")).scalar() == 0
    assert db.execute(text("SELECT count(*) FROM task_comments")).scalar() == 0


def test_overdue_filter_ignores_completed_tasks(client, team):
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    task = create_task(client, team.owner, [team.employee_id], deadline=yesterday)

    overdue = client.get("/tasks", headers=auth(team.owner), params={"overdue": True}).json()
    assert [t["id"] for t in overdue] == [task["id"]]

    client.patch(f"/tasks/{task['id']}/status", headers=auth(team.employee), json={"status": "completed"})
    overdue = client.get("/tasks", headers=auth(team.owner), params={"overdue": True}).json()
    assert overdue == []