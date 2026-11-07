import pytest

from tests.helpers import add_member, auth, find_employee_id

MANAGER_ONLY_PAGES = [
    "/employees",
    "/schedules",
    "/workplaces",
    "/attendance",
    "/attendance/today",
    "/tasks",
    "/wage-rules",
    "/pay-summaries",
    "/audit-logs",
]


@pytest.mark.parametrize("path", MANAGER_ONLY_PAGES)
def test_an_employee_cannot_open_manager_pages(client, team, path):
    response = client.get(path, headers=auth(team.employee))

    assert response.status_code == 403, path


@pytest.mark.parametrize("path", ["/auth/me", "/employees", "/tasks/me", "/attendance/me/status"])
def test_requests_without_a_token_are_rejected(client, path):
    response = client.get(path)

    assert response.status_code in (401, 403), path


def test_a_manager_cannot_change_wages_but_can_edit_other_details(client, emails, team):
    manager = add_member(client, emails, team.owner, "mary@example.com", role="manager", name="Mary Manager")

    wage = client.patch(
        f"/employees/{team.employee_id}", headers=auth(manager["token"]), json={"wage_rate": "9999.00"}
    )
    code = client.patch(
        f"/employees/{team.employee_id}", headers=auth(manager["token"]), json={"staff_code": "EMP-001"}
    )

    assert wage.status_code == 403
    assert code.status_code == 200


def test_a_manager_cannot_manage_another_manager(client, emails, team):
    first = add_member(client, emails, team.owner, "mary@example.com", role="manager", name="Mary Manager")
    second = add_member(client, emails, team.owner, "mark@example.com", role="manager", name="Mark Manager")

    response = client.post(
        f"/employees/{second['employee_id']}/deactivate", headers=auth(first["token"])
    )

    assert response.status_code == 403


def test_a_manager_cannot_invite_a_manager(client, emails, team):
    manager = add_member(client, emails, team.owner, "mary@example.com", role="manager", name="Mary Manager")

    response = client.post(
        "/employees/invite",
        headers=auth(manager["token"]),
        json={"full_name": "New Manager", "email": "new@example.com", "role": "manager"},
    )

    assert response.status_code == 403


def test_only_the_owner_can_read_the_audit_log(client, emails, team):
    manager = add_member(client, emails, team.owner, "mary@example.com", role="manager", name="Mary Manager")

    assert client.get("/audit-logs", headers=auth(manager["token"])).status_code == 403
    assert client.get("/audit-logs", headers=auth(team.owner)).status_code == 200


def test_only_the_owner_can_change_wage_rules(client, emails, team):
    manager = add_member(client, emails, team.owner, "mary@example.com", role="manager", name="Mary Manager")
    rules = {
        "deduct_scheduled_break": True,
        "min_minutes_for_daily_pay": 240,
        "overtime_enabled": False,
        "overtime_after_minutes": 480,
        "overtime_multiplier": "1.50",
        "lateness_deduction_enabled": False,
        "lateness_deduction_per_minute": "0.00",
    }

    assert client.put("/wage-rules", headers=auth(manager["token"]), json=rules).status_code == 403
    assert client.put("/wage-rules", headers=auth(team.owner), json=rules).status_code == 200


def test_a_deactivated_employee_loses_access_immediately(client, team):
    assert client.get("/auth/me", headers=auth(team.employee)).status_code == 200

    response = client.post(f"/employees/{team.employee_id}/deactivate", headers=auth(team.owner))
    assert response.status_code == 200

    assert client.get("/auth/me", headers=auth(team.employee)).status_code == 401
    login = client.post(
        "/auth/login", json={"email": "chika@example.com", "password": "password123"}
    )
    assert login.status_code == 403


def test_the_owner_cannot_be_deactivated_and_nobody_can_deactivate_themselves(client, emails, team):
    owner_id = find_employee_id(client, team.owner, "owner@example.com")
    manager = add_member(client, emails, team.owner, "mary@example.com", role="manager", name="Mary Manager")

    by_owner = client.post(f"/employees/{owner_id}/deactivate", headers=auth(team.owner))
    by_manager = client.post(f"/employees/{owner_id}/deactivate", headers=auth(manager["token"]))
    self_by_manager = client.post(
        f"/employees/{manager['employee_id']}/deactivate", headers=auth(manager["token"])
    )

    assert by_owner.status_code == 400
    assert by_manager.status_code == 400
    assert self_by_manager.status_code == 400




def test_an_employee_cannot_get_qr_codes_or_change_workplaces(client, team):
            qr = client.get(f"/workplaces/{team.workplace_id}/qr", headers=auth(team.employee))
            create = client.post("/workplaces", headers=auth(team.employee), json={"name": "Home"})
            regenerate = client.post(f"/workplaces/{team.workplace_id}/regenerate", headers=auth(team.employee))
            switch_off = client.patch(
                f"/workplaces/{team.workplace_id}", headers=auth(team.employee), json={"active": False}
            )
        
            assert qr.status_code == 403
            assert create.status_code == 403
            assert regenerate.status_code == 403
            assert switch_off.status_code == 403





def test_unknown_fields_are_rejected_instead_of_ignored(client, team):
    response = client.patch(
        f"/employees/{team.employee_id}", headers=auth(team.owner), json={"wage_rat": "100.00"}
    )

    assert response.status_code == 422