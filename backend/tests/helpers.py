from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def register_business(client, name="Test Bakery", email="owner@example.com") -> str:
    response = client.post(
        "/auth/register",
        json={
            "business_name": name,
            "timezone": "Africa/Lagos",
            "currency": "NGN",
            "full_name": "Owner Person",
            "email": email,
            "password": "password123",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()["access_token"]


def invite_token(client, emails, owner_token, email, role="employee", name="Staff Person") -> str:
    response = client.post(
        "/employees/invite",
        headers=auth(owner_token),
        json={"full_name": name, "email": email, "role": role},
    )
    assert response.status_code == 201, response.text

    invite_link = emails[-1]["args"][3]
    return invite_link.split("token=")[1]


def find_employee_id(client, token, email) -> int:
    response = client.get("/employees", headers=auth(token), params={"search": email})
    assert response.status_code == 200, response.text
    return response.json()[0]["id"]


def add_member(client, emails, owner_token, email, role="employee", name="Staff Person") -> dict:
    """Invites someone and accepts the invite. Returns their login token and employee id."""
    token = invite_token(client, emails, owner_token, email, role, name)

    response = client.post(
        "/auth/accept-invite", json={"token": token, "password": "password123"}
    )
    assert response.status_code == 200, response.text

    return {
        "token": response.json()["access_token"],
        "employee_id": find_employee_id(client, owner_token, email),
    }


def create_workplace(client, token, name="Main gate") -> int:
    response = client.post("/workplaces", headers=auth(token), json={"name": name})
    assert response.status_code == 201, response.text
    return response.json()["id"]


def get_qr_token(client, token, workplace_id) -> str:
    response = client.get(f"/workplaces/{workplace_id}/qr", headers=auth(token))
    assert response.status_code == 200, response.text
    return response.json()["token"]


def clock(client, token, qr_token, event_type, request_id):
    return client.post(
        "/attendance/clock",
        headers=auth(token),
        json={"qr_token": qr_token, "event_type": event_type, "request_id": request_id},
    )


def add_manual_event(client, token, employee_id, event_type, moment) -> dict:
    response = client.post(
        "/attendance/manual",
        headers=auth(token),
        json={
            "employee_id": employee_id,
            "event_type": event_type,
            "occurred_at": moment,
            "reason": "Test entry",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def last_monday() -> date:
    today = datetime.now(ZoneInfo("Africa/Lagos")).date()
    return today - timedelta(days=today.weekday() + 7)


def at(day: date, hour: int, minute: int = 0) -> str:
    return f"{day.isoformat()}T{hour:02d}:{minute:02d}:00+01:00"