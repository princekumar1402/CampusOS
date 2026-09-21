"""
CampusOS — Day 6 Live End-to-End & Regression Verification Script
"""
from __future__ import annotations

import httpx

API_BASE = "http://localhost:8000/api/v1"
FE_BASE = "http://localhost:3000"


def main():
    print("--- 1. Testing Live Backend Auth & RAG Assistant ---")
    with httpx.Client(base_url=API_BASE, timeout=15.0) as client:
        # Register or login
        login_res = client.post(
            "/auth/login",
            json={"email": "student_day6_live@campusos.edu", "password": "Password123!"},
        )
        if login_res.status_code != 200:
            reg_res = client.post(
                "/auth/register",
                json={
                    "full_name": "Live Student Tester",
                    "email": "student_day6_live@campusos.edu",
                    "password": "Password123!",
                },
            )
            assert reg_res.status_code == 201, f"Registration failed: {reg_res.text}"
            login_res = client.post(
                "/auth/login",
                json={"email": "student_day6_live@campusos.edu", "password": "Password123!"},
            )
            assert login_res.status_code == 200, f"Login failed: {login_res.text}"

        token = login_res.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        print("[OK] Authentication token obtained.")

        # Test cases
        test_cases = [
            ("Attendance Requirement", "What is the attendance requirement?", "attendance_policy.md", False),
            ("CampusFix Issue Report", "How do I report a campus maintenance problem?", "campusfix_policy.md", False),
            ("Internship Application", "How can I apply for an internship?", "internship_policy.md", False),
            ("Joining Student Club", "What is the process for joining a student club?", "events_clubs_policy.md", False),
            ("Academic Registration", "What are the course registration guidelines?", "academic_guidelines.md", False),
            ("Unrelated Question", "What is the capital of France?", None, True),
        ]

        for label, question, expected_doc, is_fallback in test_cases:
            res = client.post("/assistant/ask", json={"question": question}, headers=headers)
            assert res.status_code == 200, f"Query '{question}' returned {res.status_code}: {res.text}"
            data = res.json()
            print(f"\n[Test] {label}")
            print(f"  Question : {question}")
            print(f"  Answer   : {data['answer'][:120]}...")
            print(f"  Sources  : {data['sources']}")

            if is_fallback:
                assert data["answer"] == "I couldn't find that information in the available CampusOS policy documents."
                assert data["sources"] == []
                print("  [OK] Fallback correctly triggered with zero sources cited.")
            else:
                docs = [s["document"] for s in data["sources"]]
                assert expected_doc in docs, f"Expected {expected_doc} in {docs}"
                print(f"  [OK] Grounded answer verified with expected source: {expected_doc}")

    print("\n--- 2. Verifying OpenAPI & Docs Endpoints ---")
    with httpx.Client(timeout=10.0) as client:
        openapi = client.get("http://localhost:8000/openapi.json")
        assert openapi.status_code == 200
        assert "/api/v1/assistant/ask" in openapi.json()["paths"]
        print("[OK] /api/v1/assistant/ask appears in /openapi.json")

        docs = client.get("http://localhost:8000/docs")
        assert docs.status_code == 200
        print("[OK] Swagger UI /docs loads with HTTP 200")

    print("\n--- 3. Verifying Frontend Pages & Regression Navigation ---")
    frontend_routes = [
        "/dashboard/assistant",
        "/dashboard/attendance",
        "/dashboard/events",
        "/dashboard/clubs",
        "/dashboard/complaints",
        "/dashboard/notifications",
        "/dashboard/internships",
        "/dashboard/applications",
        "/dashboard",
    ]
    with httpx.Client(base_url=FE_BASE, timeout=10.0) as client:
        for route in frontend_routes:
            r = client.get(route)
            assert r.status_code == 200, f"Route {route} failed: {r.status_code}"
            print(f"[OK] {route} returned HTTP 200 OK")

    print("\n=======================================================")
    print("ALL DAY 6 LIVE E2E & REGRESSION VERIFICATIONS PASSED!")
    print("=======================================================")


if __name__ == "__main__":
    main()
