"""
CampusOS — Academic Management & Profiles Tests
==============================================
Test suite for Departments, Student Profiles, and Faculty Profiles endpoints.
"""
from __future__ import annotations

from datetime import UTC, datetime
import pytest
from httpx import AsyncClient

from app.core.security import create_access_token
from app.models.user import UserRole
from app.services.auth_service import auth_service
from app.schemas.auth import UserRegisterRequest


@pytest.mark.asyncio
async def test_create_and_list_departments(client: AsyncClient, db_session) -> None:
    # 1. Register an Admin user
    admin_user = await auth_service.register(
        db_session,
        UserRegisterRequest(
            full_name="Admin User",
            email="admin.academic@university.edu",
            password="AdminPassword123!",
        ),
    )
    admin_user.role = UserRole.ADMIN
    admin_user.updated_at = datetime.now(UTC)
    await db_session.commit()

    token = create_access_token(admin_user.id, role=UserRole.ADMIN)
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create department
    response = await client.post(
        "/api/v1/departments",
        json={"code": "CS", "name": "Computer Science", "description": "School of CS"},
        headers=headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["code"] == "CS"
    assert data["name"] == "Computer Science"

    # 3. List departments
    list_res = await client.get("/api/v1/departments", headers=headers)
    assert list_res.status_code == 200
    depts = list_res.json()
    assert len(depts) == 1
    assert depts[0]["code"] == "CS"


@pytest.mark.asyncio
async def test_student_role_cannot_create_department(client: AsyncClient, db_session) -> None:
    student_user = await auth_service.register(
        db_session,
        UserRegisterRequest(
            full_name="Student User",
            email="student.test@university.edu",
            password="StudentPassword123!",
        ),
    )
    token = create_access_token(student_user.id, role=UserRole.STUDENT)
    headers = {"Authorization": f"Bearer {token}"}

    response = await client.post(
        "/api/v1/departments",
        json={"code": "EE", "name": "Electrical Engineering"},
        headers=headers,
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_student_profile_me_and_update(client: AsyncClient, db_session) -> None:
    student_user = await auth_service.register(
        db_session,
        UserRegisterRequest(
            full_name="Jane Student",
            email="jane.student@university.edu",
            password="StudentPassword123!",
        ),
    )
    token = create_access_token(student_user.id, role=UserRole.STUDENT)
    headers = {"Authorization": f"Bearer {token}"}

    # Update own student profile
    update_res = await client.put(
        "/api/v1/students/me",
        json={
            "student_id": "STU-2026-99",
            "program": "B.Tech AI & ML",
            "batch_year": 2026,
            "cgpa": 3.9,
            "bio": "Enthusiastic about AI",
        },
        headers=headers,
    )
    assert update_res.status_code == 200
    profile_data = update_res.json()
    assert profile_data["student_id"] == "STU-2026-99"
    assert profile_data["program"] == "B.Tech AI & ML"
    assert profile_data["user"]["email"] == "jane.student@university.edu"

    # Get /me profile
    get_me_res = await client.get("/api/v1/students/me", headers=headers)
    assert get_me_res.status_code == 200
    me_data = get_me_res.json()
    assert me_data["student_id"] == "STU-2026-99"


@pytest.mark.asyncio
async def test_faculty_profile_me_and_update(client: AsyncClient, db_session) -> None:
    faculty_user = await auth_service.register(
        db_session,
        UserRegisterRequest(
            full_name="Dr. Alan Turing",
            email="alan.turing@university.edu",
            password="FacultyPassword123!",
        ),
    )
    faculty_user.role = UserRole.FACULTY
    faculty_user.updated_at = datetime.now(UTC)
    await db_session.commit()

    token = create_access_token(faculty_user.id, role=UserRole.FACULTY)
    headers = {"Authorization": f"Bearer {token}"}

    # Create/Update faculty profile
    update_res = await client.put(
        "/api/v1/faculty/me",
        json={
            "employee_id": "FAC-101",
            "designation": "Full Professor",
            "specialization": "Computation Theory & AI",
            "office_location": "Turing Building Room 404",
        },
        headers=headers,
    )
    assert update_res.status_code == 200
    fac_data = update_res.json()
    assert fac_data["employee_id"] == "FAC-101"
    assert fac_data["designation"] == "Full Professor"

    # List faculty profiles
    list_res = await client.get("/api/v1/faculty", headers=headers)
    assert list_res.status_code == 200
    faculty_list = list_res.json()
    assert len(faculty_list) == 1
    assert faculty_list[0]["employee_id"] == "FAC-101"
