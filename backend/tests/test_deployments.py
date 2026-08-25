from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_create_and_run_deployment():
    proj_resp = client.post("/projects", json={"name": "Deploy App", "description": "Testing pipeline"})
    assert proj_resp.status_code == 200
    project_id = proj_resp.json()["id"]

    deploy_resp = client.post(
        "/deployments",
        json={"project_id": project_id, "commit_hash": "a1b2c3d", "environment": "production"},
    )
    assert deploy_resp.status_code == 200
    data = deploy_resp.json()
    assert data["status"] == "SUCCESS"
    assert "Starting CI/CD Deployment Pipeline" in data["logs"]


def test_instant_rollback():
    # 1. Create deployment to roll back to
    proj_resp = client.post("/projects", json={"name": "Rollback Test", "description": "Rollback testing"})
    project_id = proj_resp.json()["id"]
    deploy_resp = client.post("/deployments", json={"project_id": project_id, "commit_hash": "v1.0.0"})
    deploy_id = deploy_resp.json()["id"]

    # 2. Trigger rollback
    rollback_resp = client.post(f"/deployments/{deploy_id}/rollback")
    assert rollback_resp.status_code == 200
    data = rollback_resp.json()
    assert data["status"] == "SUCCESS"
    assert "rollback-to-" in data["commit_hash"]
    assert "INITIATING INSTANT ROLLBACK" in data["logs"]


def test_monitoring_health_metrics():
    response = client.get("/monitoring/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "healthy"
    assert "latency_ms" in data
    assert "uptime" in data