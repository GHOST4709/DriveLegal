"""Pytest tests for the DriveLegal / Road Safety AI FastAPI backend.

Run from this directory with:
    python -m pytest -v

These tests use a fresh in-memory SQLite database for each test. They do not
read or modify the project's bimstec_traffic.db file and do not call external
AI/search services.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, get_db
from main import app
from models import TrafficLaw


@pytest.fixture
def client():
    """Provide an isolated test DB and a FastAPI test client for each test."""
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(
        bind=test_engine,
        autocommit=False,
        autoflush=False,
    )

    Base.metadata.create_all(bind=test_engine)

    # Seed deterministic data so tests don't depend on the developer's DB.
    with TestingSessionLocal() as db:
        db.add_all(
            [
                TrafficLaw(
                    country="Bangladesh",
                    city="Dhaka",
                    violation_name="Speeding",
                    vehicle_type="Four-Wheeler",
                    fine_amount=5000,
                    currency="BDT",
                    legal_consequence="Possible licence suspension",
                ),
                TrafficLaw(
                    country="Bangladesh",
                    city="Dhaka",
                    violation_name="Red Light",
                    vehicle_type="Two-Wheeler",
                    fine_amount=1000,
                    currency="BDT",
                    legal_consequence="Penalty points may apply",
                ),
                TrafficLaw(
                    country="Thailand",
                    city="Bangkok",
                    violation_name="No Helmet",
                    vehicle_type="Two-Wheeler",
                    fine_amount=2000,
                    currency="THB",
                    legal_consequence="Fine for riding without a helmet",
                ),
            ]
        )
        db.commit()

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)

    try:
        yield test_client
    finally:
        test_client.close()
        app.dependency_overrides.pop(get_db, None)
        Base.metadata.drop_all(bind=test_engine)
        test_engine.dispose()


def register_user(client: TestClient, email: str = "driver@example.com") -> dict:
    """Helper used by authentication tests."""
    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Test Driver",
            "email": email,
            "password": "SafePass123",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_health_endpoint_returns_ok(client: TestClient):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "Road Safety AI",
        "version": "1.0.0",
    }


def test_openapi_schema_lists_expected_routes(client: TestClient):
    response = client.get("/openapi.json")

    assert response.status_code == 200
    paths = response.json()["paths"]
    assert "/health" in paths
    assert "/api/laws/{country}/{city}" in paths
    assert "/api/calculate" in paths
    assert "/api/chat" in paths
    assert "/api/auth/register" in paths
    assert "/api/auth/login" in paths
    assert "/api/auth/me" in paths


def test_get_laws_returns_matching_city_records_case_insensitively(
    client: TestClient,
):
    response = client.get("/api/laws/bAnGlAdEsH/dHaKa")

    assert response.status_code == 200
    laws = response.json()
    assert len(laws) == 2
    assert {law["violation_name"] for law in laws} == {"Speeding", "Red Light"}
    assert all(law["country"] == "Bangladesh" for law in laws)
    assert all(law["city"] == "Dhaka" for law in laws)


def test_get_laws_returns_empty_list_when_location_has_no_records(
    client: TestClient,
):
    response = client.get("/api/laws/Neverland/UnknownCity")

    assert response.status_code == 200
    assert response.json() == []


def test_calculate_fine_returns_matching_record_case_insensitively(
    client: TestClient,
):
    response = client.get(
        "/api/calculate",
        params={
            "city": "dHaKa",
            "violation_name": "sPeEdInG",
            "vehicle_type": "four-wheeler",
        },
    )

    assert response.status_code == 200
    law = response.json()
    assert law["city"] == "Dhaka"
    assert law["violation_name"] == "Speeding"
    assert law["vehicle_type"] == "Four-Wheeler"
    assert law["fine_amount"] == 5000
    assert law["currency"] == "BDT"


def test_calculate_fine_returns_404_for_unknown_violation(client: TestClient):
    response = client.get(
        "/api/calculate",
        params={
            "city": "Dhaka",
            "violation_name": "Unknown Violation",
            "vehicle_type": "Four-Wheeler",
        },
    )

    assert response.status_code == 404
    assert "No traffic law found" in response.json()["detail"]


def test_calculate_fine_requires_all_query_parameters(client: TestClient):
    response = client.get("/api/calculate", params={"city": "Dhaka"})

    assert response.status_code == 422


def test_chat_rejects_empty_message_without_calling_external_services(
    client: TestClient,
):
    response = client.post("/api/chat", json={"message": ""})

    assert response.status_code == 422


def test_register_creates_user_and_returns_bearer_token(client: TestClient):
    result = register_user(client, email="  DRIVER@Example.com  ")

    assert result["access_token"]
    assert result["token_type"] == "bearer"
    assert result["user"]["email"] == "driver@example.com"
    assert result["user"]["full_name"] == "Test Driver"
    assert "hashed_password" not in result["user"]


def test_register_rejects_duplicate_email_case_insensitively(
    client: TestClient,
):
    register_user(client, email="driver@example.com")

    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Second Driver",
            "email": "DRIVER@EXAMPLE.COM",
            "password": "OtherPass123",
        },
    )

    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_login_accepts_correct_credentials(client: TestClient):
    register_user(client)

    response = client.post(
        "/api/auth/login",
        json={"email": "DRIVER@EXAMPLE.COM", "password": "SafePass123"},
    )

    assert response.status_code == 200
    assert response.json()["access_token"]
    assert response.json()["token_type"] == "bearer"


def test_login_rejects_incorrect_password(client: TestClient):
    register_user(client)

    response = client.post(
        "/api/auth/login",
        json={"email": "driver@example.com", "password": "wrong-password"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password."


def test_current_user_endpoint_accepts_valid_bearer_token(client: TestClient):
    result = register_user(client)

    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {result['access_token']}"},
    )

    assert response.status_code == 200
    assert response.json()["email"] == "driver@example.com"
    assert response.json()["full_name"] == "Test Driver"


def test_current_user_endpoint_rejects_missing_token(client: TestClient):
    response = client.get("/api/auth/me")

    # FastAPI versions have returned either 401 or 403 for missing Bearer auth.
    assert response.status_code in (401, 403)
