import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app

# Use an in-memory SQLite database for fast, isolated CI tests
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override the get_db dependency for tests
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Create test tables
Base.metadata.create_all(bind=engine)

client = TestClient(app)


def test_create_and_get_project():
    # 1. Create a project
    payload = {
        "name": "CI/CD Test Project",
        "description": "Created during automated testing",
    }
    response = client.post("/projects", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "CI/CD Test Project"
    assert "id" in data
    project_id = data["id"]

    # 2. Get the created project by ID
    get_response = client.get(f"/projects/{project_id}")
    assert get_response.status_code == 200
    assert get_response.json()["name"] == "CI/CD Test Project"


def test_get_all_projects():
    response = client.get("/projects")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) >= 1


def test_get_nonexistent_project():
    response = client.get("/projects/99999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Project not found"