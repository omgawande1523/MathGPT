from fastapi.testclient import TestClient
from app.main import app
from app.database import init_db

client = TestClient(app)

def setup_module(module):
    # Initialize test schema
    init_db()

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to MathGPT Enterprise Neuro-Symbolic platform"}

def test_auth_and_project_flow():
    # 1. Sign up user
    signup_payload = {
        "email": "test_scientist@mathgpt.io",
        "password": "quantum_field_theory_9988",
        "full_name": "Edward Witten",
        "role": "researcher"
    }
    resp = client.post("/api/v1/auth/signup", json=signup_payload)
    # Check 200 or 400 (if already registered in database)
    assert resp.status_code in (200, 400)

    # 2. Login user
    login_payload = {
        "email": "test_scientist@mathgpt.io",
        "password": "quantum_field_theory_9988"
    }
    resp = client.post("/api/v1/auth/login", json=login_payload)
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    assert token is not None

    # 3. Create Project
    headers = {"Authorization": f"Bearer {token}"}
    project_payload = {
        "name": "M-Theory Dimensional Reduction",
        "description": "Formulating Kaluza-Klein proof structures mathematically."
    }
    resp = client.post("/api/v1/projects", json=project_payload, headers=headers)
    assert resp.status_code == 200
    project_id = resp.json()["id"]
    assert project_id is not None

def test_symbolic_solver():
    # Solve derivative
    payload = {
        "expression": "x**2 + 3*x",
        "operation": "differentiate",
        "variables": ["x"]
    }
    resp = client.post("/api/v1/solver", json=payload)
    assert resp.status_code == 200
    res_json = resp.json()
    assert res_json["success"] is True
    assert "2*x + 3" in res_json["result"]

from unittest.mock import patch

@patch("httpx.get")
def test_arxiv_crawler_and_embeddings(mock_get):
    # Setup mock XML response matching ArXiv API Atom feed schema
    class MockResponse:
        status_code = 200
        content = b"""<?xml version="1.0" encoding="UTF-8"?>
        <feed xmlns="http://www.w3.org/2005/Atom">
          <entry>
            <id>http://arxiv.org/abs/2401.12345v1</id>
            <title>Deep Learning for Automated Theorem Proving in Lean4</title>
            <summary>We explore transformer-based LLMs fine-tuned on Mathlib4 to formulate and complete complex algebraic proof steps, verifying correctness.</summary>
            <published>2024-01-01T00:00:00Z</published>
            <author><name>T. Tao</name></author>
            <author><name>G. Gowers</name></author>
            <link title="pdf" href="https://arxiv.org/pdf/2401.12345.pdf"/>
          </entry>
        </feed>
        """
    mock_get.return_value = MockResponse()

    # Crawl paper mock
    payload = {
        "query": "theorem proving lean",
        "limit": 1
    }
    resp = client.post("/api/v1/research/search", json=payload)
    assert resp.status_code == 200
    assert len(resp.json()) > 0
    assert "id" in resp.json()[0]

def test_formula_search():
    # Search LaTeX formula
    payload = {
        "latex_formula": "e^{i\\pi} + 1 = 0"
    }
    resp = client.post("/api/v1/formula/search", json=payload)
    assert resp.status_code == 200
    assert "matches" in resp.json()
