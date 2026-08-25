from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_ai_review_sql_injection():
    vulnerable_code = """
@app.get("/users/{id}")
def get_user(id):
    query = f"SELECT * FROM users WHERE id={id}"
    return db.execute(query)
"""
    response = client.post("/ai/review", json={"code_snippet": vulnerable_code})
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] in ["HIGH", "CRITICAL"]
    assert any("SQL Injection" in issue for issue in data["issues"])


def test_ai_review_hardcoded_secret():
    secret_code = """
AWS_SECRET_KEY = "AKIA1234567890SECRETKEY"
"""
    response = client.post("/ai/review", json={"code_snippet": secret_code})
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "CRITICAL"


def test_ai_review_clean_code():
    clean_code = """
def add_numbers(a: int, b: int) -> int:
    return a + b
"""
    response = client.post("/ai/review", json={"code_snippet": clean_code})
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "LOW"


def test_get_ai_reviews_history():
    response = client.get("/ai/reviews")
    assert response.status_code == 200
    assert isinstance(response.json(), list)