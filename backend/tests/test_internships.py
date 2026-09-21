"""
CampusOS — Day 5 Internship & Career Tests
==========================================
Focused test suite for:
1. Internship listing
2. Internship creation by authorized staff/admin
3. Unauthorized student internship creation rejected
4. Internship detail retrieval
5. Student can apply
6. Duplicate application rejected
7. Student can view own applications
8. Skill matching calculation (exact 2/3 = 66.7% match)
9. Case-insensitive and whitespace skill matching
10. Missing skills calculation
11. Match percentage calculation
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
import pytest
from httpx import AsyncClient

from app.core.security import create_access_token
from app.models.user import User, UserRole
from app.repositories.academic_repository import student_profile_repository
from app.schemas.auth import UserRegisterRequest
from app.services.auth_service import auth_service
from app.services.internship_service import calculate_skill_match


async def create_test_user(
    db_session,
    full_name: str,
    email: str,
    role: UserRole = UserRole.STUDENT,
) -> tuple[User, dict[str, str]]:
    """Helper to create and authenticate a test user."""
    user = await auth_service.register(
        db_session,
        UserRegisterRequest(
            full_name=full_name,
            email=email,
            password="StrongPassword123!",
        ),
    )
    if role != UserRole.STUDENT:
        user.role = role
        user.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        await db_session.commit()

    token = create_access_token(user.id, role=user.role)
    headers = {"Authorization": f"Bearer {token}"}
    return user, headers


async def create_student_with_profile(
    db_session,
    full_name: str,
    email: str,
    skills: str = "Python, SQL, React",
):
    """Helper to create student user with StudentProfile and skills."""
    user, headers = await create_test_user(db_session, full_name, email, role=UserRole.STUDENT)
    profile = await student_profile_repository.create_or_update(
        db_session,
        user_id=user.id,
        student_id=f"STU-{uuid.uuid4().hex[:6].upper()}",
        skills=skills,
    )
    await db_session.commit()
    return user, headers, profile


@pytest.mark.asyncio
async def test_internship_creation_by_authorized_admin(client: AsyncClient, db_session) -> None:
    """1. Authorized admin can create an internship."""
    _, admin_headers = await create_test_user(
        db_session, "Admin User", "admin.career@university.edu", role=UserRole.ADMIN
    )
    payload = {
        "title": "Software Engineering Intern",
        "company": "TechNova Corp",
        "description": "Work on distributed cloud backend microservices.",
        "required_skills": "Python, SQL, Docker",
        "location": "Bangalore",
        "mode": "Hybrid",
    }
    response = await client.post("/api/v1/internships", json=payload, headers=admin_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Software Engineering Intern"
    assert data["company"] == "TechNova Corp"
    assert "Python" in data["required_skills"]
    assert "SQL" in data["required_skills"]
    assert data["mode"] == "Hybrid"


@pytest.mark.asyncio
async def test_internship_creation_by_authorized_faculty(client: AsyncClient, db_session) -> None:
    """2. Authorized faculty can also create an internship."""
    _, faculty_headers = await create_test_user(
        db_session, "Prof Alan", "alan.faculty@university.edu", role=UserRole.FACULTY
    )
    payload = {
        "title": "Research Intern - ML",
        "company": "Campus AI Lab",
        "description": "Collaborate on generative model architectures.",
        "required_skills": "Python, PyTorch",
        "location": "Campus Lab 3",
        "mode": "On-site",
    }
    response = await client.post("/api/v1/internships", json=payload, headers=faculty_headers)
    assert response.status_code == 201
    assert response.json()["company"] == "Campus AI Lab"


@pytest.mark.asyncio
async def test_unauthorized_student_internship_creation_rejected(client: AsyncClient, db_session) -> None:
    """3. Unauthorized student cannot create an internship."""
    _, student_headers = await create_test_user(
        db_session, "Student Jane", "jane.intern@university.edu", role=UserRole.STUDENT
    )
    payload = {
        "title": "Fake Intern",
        "company": "Unauthorized Inc",
        "description": "Should be rejected.",
        "required_skills": "Python",
        "location": "Remote",
        "mode": "Remote",
    }
    response = await client.post("/api/v1/internships", json=payload, headers=student_headers)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_internship_listing(client: AsyncClient, db_session) -> None:
    """4. Students and users can browse internship listings."""
    _, admin_headers = await create_test_user(
        db_session, "Admin Poster", "admin.list@university.edu", role=UserRole.ADMIN
    )
    payload = {
        "title": "Full Stack Intern",
        "company": "Innovate Ltd",
        "description": "Frontend and backend web systems.",
        "required_skills": "React, Node.js, TypeScript",
        "location": "Hyderabad",
        "mode": "Remote",
    }
    create_resp = await client.post("/api/v1/internships", json=payload, headers=admin_headers)
    assert create_resp.status_code == 201

    _, student_headers, _ = await create_student_with_profile(
        db_session, "Browsing Student", "browse.student@university.edu", skills="React, TypeScript"
    )
    list_resp = await client.get("/api/v1/internships", headers=student_headers)
    assert list_resp.status_code == 200
    data = list_resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    item = next(i for i in data if i["title"] == "Full Stack Intern")
    assert item["company"] == "Innovate Ltd"
    assert item["skill_match"] is not None
    assert "React" in item["skill_match"]["matched_skills"]
    assert "TypeScript" in item["skill_match"]["matched_skills"]
    assert "Node.js" in item["skill_match"]["missing_skills"]


@pytest.mark.asyncio
async def test_internship_detail_retrieval(client: AsyncClient, db_session) -> None:
    """5. Retrieve single internship details with skill matching."""
    _, admin_headers = await create_test_user(
        db_session, "Admin User", "admin.detail@university.edu", role=UserRole.ADMIN
    )
    create_resp = await client.post(
        "/api/v1/internships",
        json={
            "title": "Backend Dev Intern",
            "company": "Fintech Global",
            "description": "High performance financial APIs.",
            "required_skills": "Go, PostgreSQL, Redis",
            "location": "Mumbai",
            "mode": "Hybrid",
        },
        headers=admin_headers,
    )
    internship_id = create_resp.json()["id"]

    _, student_headers, _ = await create_student_with_profile(
        db_session, "Go Student", "go.student@university.edu", skills="Go, PostgreSQL"
    )
    get_resp = await client.get(f"/api/v1/internships/{internship_id}", headers=student_headers)
    assert get_resp.status_code == 200
    data = get_resp.json()
    assert data["id"] == internship_id
    assert data["company"] == "Fintech Global"
    assert data["skill_match"]["total_required"] == 3
    assert len(data["skill_match"]["matched_skills"]) == 2
    assert "Redis" in data["skill_match"]["missing_skills"]
    assert data["has_applied"] is False


@pytest.mark.asyncio
async def test_student_can_apply(client: AsyncClient, db_session) -> None:
    """6. Student can apply to an internship."""
    _, admin_headers = await create_test_user(
        db_session, "Admin Post", "admin.apply@university.edu", role=UserRole.ADMIN
    )
    create_resp = await client.post(
        "/api/v1/internships",
        json={
            "title": "DevOps Intern",
            "company": "CloudScape",
            "description": "Infrastructure as Code and CI/CD.",
            "required_skills": "Linux, Docker, Terraform",
            "location": "Remote",
            "mode": "Remote",
        },
        headers=admin_headers,
    )
    internship_id = create_resp.json()["id"]

    _, student_headers, _ = await create_student_with_profile(
        db_session, "Applicant Student", "applicant@university.edu", skills="Linux, Docker"
    )
    apply_resp = await client.post(
        f"/api/v1/internships/{internship_id}/apply", headers=student_headers
    )
    assert apply_resp.status_code == 201
    data = apply_resp.json()
    assert data["internship_id"] == internship_id
    assert data["status"] == "APPLIED"
    assert data["internship"]["title"] == "DevOps Intern"


@pytest.mark.asyncio
async def test_duplicate_application_rejected(client: AsyncClient, db_session) -> None:
    """7. Duplicate application to the same internship is rejected."""
    _, admin_headers = await create_test_user(
        db_session, "Admin Poster", "admin.dup@university.edu", role=UserRole.ADMIN
    )
    create_resp = await client.post(
        "/api/v1/internships",
        json={
            "title": "QA Automation Intern",
            "company": "QualityWorks",
            "description": "End-to-end testing with Playwright.",
            "required_skills": "Python, Selenium",
            "location": "Pune",
            "mode": "On-site",
        },
        headers=admin_headers,
    )
    internship_id = create_resp.json()["id"]

    _, student_headers, _ = await create_student_with_profile(
        db_session, "Repeat Applicant", "repeat.applicant@university.edu", skills="Python"
    )
    first_apply = await client.post(
        f"/api/v1/internships/{internship_id}/apply", headers=student_headers
    )
    assert first_apply.status_code == 201

    second_apply = await client.post(
        f"/api/v1/internships/{internship_id}/apply", headers=student_headers
    )
    assert second_apply.status_code in (400, 409)
    resp_body = second_apply.json()
    err_text = (resp_body.get("message") or resp_body.get("detail") or "").lower()
    assert "already applied" in err_text


@pytest.mark.asyncio
async def test_student_can_view_own_applications(client: AsyncClient, db_session) -> None:
    """8. Student can view their own applications list."""
    _, admin_headers = await create_test_user(
        db_session, "Admin Post", "admin.myapps@university.edu", role=UserRole.ADMIN
    )
    create_resp = await client.post(
        "/api/v1/internships",
        json={
            "title": "Cybersecurity Intern",
            "company": "SecureNet",
            "description": "Vulnerability assessment and hardening.",
            "required_skills": "Network Security, Linux",
            "location": "Delhi",
            "mode": "Hybrid",
        },
        headers=admin_headers,
    )
    internship_id = create_resp.json()["id"]

    _, student_headers, _ = await create_student_with_profile(
        db_session, "Security Student", "sec.student@university.edu", skills="Linux"
    )
    await client.post(f"/api/v1/internships/{internship_id}/apply", headers=student_headers)

    my_apps_resp = await client.get("/api/v1/applications/me", headers=student_headers)
    assert my_apps_resp.status_code == 200
    apps = my_apps_resp.json()
    assert len(apps) == 1
    assert apps[0]["internship_id"] == internship_id
    assert apps[0]["status"] == "APPLIED"
    assert apps[0]["internship"]["company"] == "SecureNet"


def test_skill_matching_exact_specification() -> None:
    """9. Test exact skill matching example from specification:

    Internship: Python, SQL, Machine Learning
    Student: Python, SQL, React
    Matched: Python, SQL
    Missing: Machine Learning
    Score: 2 / 3 = 66.7%
    """
    result = calculate_skill_match(
        required_skills_input="Python, SQL, Machine Learning",
        student_skills_input="Python, SQL, React",
    )
    assert result.total_required == 3
    assert result.matched_skills == ["Python", "SQL"]
    assert result.missing_skills == ["Machine Learning"]
    assert result.match_percentage == 66.7


def test_case_insensitive_and_whitespace_skill_matching() -> None:
    """10. Case-insensitive and whitespace-trimmed matching."""
    result = calculate_skill_match(
        required_skills_input="  python , SQL,  Docker ",
        student_skills_input=" PYTHON, docker , Go ",
    )
    assert result.total_required == 3
    assert result.matched_skills == ["python", "Docker"]
    assert result.missing_skills == ["SQL"]
    assert result.match_percentage == 66.7


def test_missing_skills_zero_overlap() -> None:
    """11. Missing skills when student has no overlap."""
    result = calculate_skill_match(
        required_skills_input="Java, Spring Boot, Kubernetes",
        student_skills_input="Python, Django",
    )
    assert result.total_required == 3
    assert result.matched_skills == []
    assert result.missing_skills == ["Java", "Spring Boot", "Kubernetes"]
    assert result.match_percentage == 0.0


def test_match_percentage_full_overlap() -> None:
    """12. 100% match when student has all required skills."""
    result = calculate_skill_match(
        required_skills_input=["Python", "FastAPI"],
        student_skills_input=["FastAPI", "Python", "Docker", "PostgreSQL"],
    )
    assert result.total_required == 2
    assert result.matched_skills == ["Python", "FastAPI"]
    assert result.missing_skills == []
    assert result.match_percentage == 100.0
