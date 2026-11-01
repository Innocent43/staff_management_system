from sqlalchemy import text

from tests.helpers import auth, invite_token, register_business


def test_register_returns_a_token_that_works(client):
    token = register_business(client)

    response = client.get("/auth/me", headers=auth(token))

    assert response.status_code == 200
    assert response.json()["role"] == "owner"
    assert response.json()["business"]["name"] == "Test Bakery"
    assert "password_hash" not in response.text


def test_register_rejects_a_duplicate_email_whatever_its_case(client):
    register_business(client, email="owner@example.com")

    response = client.post(
        "/auth/register",
        json={
            "business_name": "Another Shop",
            "timezone": "Africa/Lagos",
            "currency": "NGN",
            "full_name": "Someone Else",
            "email": "OWNER@example.com",
            "password": "password123",
        },
    )

    assert response.status_code == 409


def test_register_rejects_an_unknown_timezone(client):
    response = client.post(
        "/auth/register",
        json={
            "business_name": "Test Bakery",
            "timezone": "Mars/Base",
            "currency": "NGN",
            "full_name": "Owner Person",
            "email": "owner@example.com",
            "password": "password123",
        },
    )

    assert response.status_code == 422


def test_login_works_with_the_right_password(client):
    register_business(client)

    response = client.post(
        "/auth/login", json={"email": "owner@example.com", "password": "password123"}
    )

    assert response.status_code == 200
    assert response.json()["access_token"]


def test_login_errors_do_not_reveal_whether_the_email_exists(client):
    register_business(client)

    wrong_password = client.post(
        "/auth/login", json={"email": "owner@example.com", "password": "wrong-password"}
    )
    unknown_email = client.post(
        "/auth/login", json={"email": "nobody@example.com", "password": "wrong-password"}
    )

    assert wrong_password.status_code == 401
    assert unknown_email.status_code == 401
    assert wrong_password.json() == unknown_email.json()


def test_login_is_rate_limited_per_email(client):
    register_business(client)
    body = {"email": "owner@example.com", "password": "wrong-password"}

    for _ in range(5):
        assert client.post("/auth/login", json=body).status_code == 401

    assert client.post("/auth/login", json=body).status_code == 429


def test_an_invited_person_cannot_log_in_before_accepting(client, emails):
    owner = register_business(client)
    invite_token(client, emails, owner, "chika@example.com")

    response = client.post(
        "/auth/login", json={"email": "chika@example.com", "password": "password123"}
    )

    assert response.status_code == 401


def test_an_invite_link_works_only_once(client, emails):
    owner = register_business(client)
    token = invite_token(client, emails, owner, "chika@example.com")
    body = {"token": token, "password": "password123"}

    assert client.post("/auth/accept-invite", json=body).status_code == 200
    assert client.post("/auth/accept-invite", json=body).status_code == 400


def test_an_expired_invite_is_rejected(client, emails, db):
    owner = register_business(client)
    token = invite_token(client, emails, owner, "chika@example.com")
    db.execute(
        text("UPDATE memberships SET invite_expires_at = now() - interval '1 day' WHERE status = 'invited'")
    )
    db.commit()

    response = client.post(
        "/auth/accept-invite", json={"token": token, "password": "password123"}
    )

    assert response.status_code == 400


def test_invite_info_says_whether_a_password_is_needed(client, emails):
    owner = register_business(client)
    token = invite_token(client, emails, owner, "chika@example.com")

    response = client.get("/auth/invite-info", params={"token": token})

    assert response.status_code == 200
    assert response.json()["business_name"] == "Test Bakery"
    assert response.json()["needs_password"] is True


def test_invite_info_rejects_a_made_up_token(client):
    response = client.get("/auth/invite-info", params={"token": "not-a-real-token"})

    assert response.status_code == 400