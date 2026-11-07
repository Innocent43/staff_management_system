import os
from pathlib import Path
from types import SimpleNamespace

from dotenv import dotenv_values

test_settings = dotenv_values(Path(__file__).resolve().parent.parent / ".env.test")
os.environ["DATABASE_URL"] = test_settings["DATABASE_URL"]
os.environ["REDIS_URL"] = test_settings["REDIS_URL"]

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import text  # noqa: E402

from app import models  # noqa: E402, F401
from app.core.config import settings  # noqa: E402
from app.core.queue import email_queue  # noqa: E402
from app.core.redis import redis_client  # noqa: E402
from app.db.session import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from tests.helpers import add_member, create_workplace, register_business  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    assert "test" in engine.url.database, "Refusing to run: the database name must contain 'test'"
    assert not settings.redis_url.endswith("/0"), "Refusing to run: use a different Redis database"

    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield
    engine.dispose()


@pytest.fixture(autouse=True)
def clean_state():
    redis_client.flushdb()
    yield
    table_names = ", ".join(table.name for table in Base.metadata.sorted_tables)
    with engine.begin() as connection:
        connection.execute(text(f"TRUNCATE {table_names} RESTART IDENTITY CASCADE"))


@pytest.fixture(autouse=True)
def emails(monkeypatch):
    queued = []

    def fake_enqueue(function, *args, **kwargs):
        queued.append({"function": function.__name__, "args": args})

    monkeypatch.setattr(email_queue, "enqueue", fake_enqueue)
    return queued


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db():
    session = SessionLocal()
    yield session
    session.close()


@pytest.fixture
def team(client, emails):
    """One business with an owner, one employee (Chika Obi) and one QR workplace."""
    owner = register_business(client)
    employee = add_member(client, emails, owner, "chika@example.com", name="Chika Obi")
    return SimpleNamespace(
        owner=owner,
        employee=employee["token"],
        employee_id=employee["employee_id"],
        workplace_id=create_workplace(client, owner),
    )



from pwdlib import PasswordHash  # noqa: E402
from pwdlib.hashers.argon2 import Argon2Hasher  # noqa: E402


@pytest.fixture(autouse=True)
def fast_password_hashing(monkeypatch):
    fast_hasher = PasswordHash((Argon2Hasher(time_cost=1, memory_cost=1024, parallelism=1),))
    monkeypatch.setattr("app.security.password.hasher", fast_hasher)