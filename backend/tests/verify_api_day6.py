"""
CampusOS — Day 6 API Endpoint Verification
"""
from __future__ import annotations

import httpx

def test_api():
    client = httpx.Client(base_url="http://localhost:8000/api/v1", timeout=10.0)

    # 1. Unauthenticated query must return 401
    unauth = client.post("/assistant/ask", json={"question": "What is the attendance requirement?"})
    assert unauth.status_code == 401, f"Expected 401, got {unauth.status_code}"
    print("[PASS] Unauthenticated query returns 401 Unauthorized")

    # 2. Acquire access token
    login = client.post(
        "/auth/login",
        json={"email": "student_day6_live@campusos.edu", "password": "Password123!"},
    )
    assert login.status_code == 200, f"Login failed: {login.text}"
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] Authenticated student JWT acquired")

    # 3. Empty question validation (422)
    empty = client.post("/assistant/ask", json={"question": ""}, headers=headers)
    assert empty.status_code == 422, f"Expected 422, got {empty.status_code}"
    print("[PASS] Empty question string rejected with 422 Unprocessable Entity")

    # 4. Whitespace-only question validation (422)
    white = client.post("/assistant/ask", json={"question": "     \n\t  "}, headers=headers)
    assert white.status_code == 422, f"Expected 422, got {white.status_code}"
    print("[PASS] Whitespace-only question rejected with 422 Unprocessable Entity")

    # 5. Valid question structure and metadata inspection
    valid = client.post(
        "/assistant/ask",
        json={"question": "What is the attendance requirement?"},
        headers=headers,
    )
    assert valid.status_code == 200
    data = valid.json()
    assert "answer" in data and len(data["answer"]) > 0
    assert "sources" in data and len(data["sources"]) > 0
    for s in data["sources"]:
        assert "document" in s and s["document"].endswith(".md")
        assert "section" in s
        assert "embedding" not in s
        assert "vector" not in s
        assert "id" not in s
    print("[PASS] Valid authenticated question returns 200 with answer and clean sources")

    # 6. OpenAPI presence check
    openapi = httpx.get("http://localhost:8000/openapi.json").json()
    assert "/api/v1/assistant/ask" in openapi["paths"]
    endpoint_spec = openapi["paths"]["/api/v1/assistant/ask"]
    assert "post" in endpoint_spec
    assert endpoint_spec["post"]["tags"] == ["Campus AI Assistant"]
    print("[PASS] /api/v1/assistant/ask verified in /openapi.json under 'Campus AI Assistant'")

if __name__ == "__main__":
    test_api()
