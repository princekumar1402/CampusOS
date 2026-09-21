"""
CampusOS — Day 7 Admin & Statistics Tests
=========================================
Focused test suite verifying:
1. Unauthenticated access to /api/v1/admin/stats returns 401 Unauthorized
2. Student role access to /api/v1/admin/stats returns 403 Forbidden
3. Faculty role access to /api/v1/admin/stats returns 403 Forbidden
4. Admin role access to /api/v1/admin/stats returns 200 OK
5. Response schema structure validation (all 9 metrics present and non-negative)
6. Accurate counting across multiple domain entities
"""
from __future__ import annotations

from datetime import UTC, datetime
import pytest
from httpx import AsyncClient

from app.core.security import create_access_token
from app.models.academic import Department
from app.models.attendance import Course
from app.models.complaint_notification import Complaint, ComplaintStatus
from app.models.events_clubs import Club, Event
from app.models.internship import Internship
from app.models.user import User, UserRole
from app.schemas.auth import UserRegisterRequest
from app.services.auth_service import auth_service


async def create_user_with_role(
    db_session,
    full_name: str,
    email: str,
    role: UserRole = UserRole.STUDENT,
) -> tuple[User, dict[str, str]]:
    """Helper to register a user and assign a specific role."""
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
        user.updated_at = datetime.now(UTC)
        await db_session.commit()

    token = create_access_token(user.id, role=user.role)
    headers = {"Authorization": f"Bearer {token}"}
    return user, headers


@pytest.mark.asyncio
async def test_admin_stats_unauthenticated_returns_401(client: AsyncClient) -> None:
    """GET /api/v1/admin/stats without authentication must return 401 Unauthorized."""
    response = await client.get("/api/v1/admin/stats")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_admin_stats_student_returns_403(
    client: AsyncClient, db_session
) -> None:
    """Student role calling GET /api/v1/admin/stats must receive 403 Forbidden."""
    _, student_headers = await create_user_with_role(
        db_session,
        full_name="Student Tester",
        email="student.test.admin@university.edu",
        role=UserRole.STUDENT,
    )
    response = await client.get("/api/v1/admin/stats", headers=student_headers)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_stats_faculty_returns_403(
    client: AsyncClient, db_session
) -> None:
    """Faculty role calling GET /api/v1/admin/stats must receive 403 Forbidden."""
    _, faculty_headers = await create_user_with_role(
        db_session,
        full_name="Faculty Tester",
        email="faculty.test.admin@university.edu",
        role=UserRole.FACULTY,
    )
    response = await client.get("/api/v1/admin/stats", headers=faculty_headers)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_stats_admin_returns_200(
    client: AsyncClient, db_session
) -> None:
    """Admin role calling GET /api/v1/admin/stats must succeed with 200 OK."""
    _, admin_headers = await create_user_with_role(
        db_session,
        full_name="Admin Boss",
        email="admin.boss@university.edu",
        role=UserRole.ADMIN,
    )
    response = await client.get("/api/v1/admin/stats", headers=admin_headers)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_admin_stats_response_structure(
    client: AsyncClient, db_session
) -> None:
    """Verify that all 9 required statistics are present in the response body."""
    _, admin_headers = await create_user_with_role(
        db_session,
        full_name="Structure Admin",
        email="structure.admin@university.edu",
        role=UserRole.ADMIN,
    )
    response = await client.get("/api/v1/admin/stats", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()

    required_keys = [
        "students",
        "faculty",
        "courses",
        "events",
        "clubs",
        "complaints",
        "open_complaints",
        "internships",
        "applications",
    ]
    for key in required_keys:
        assert key in data, f"Key '{key}' missing from admin stats response"
        assert isinstance(data[key], int), f"Key '{key}' must be an integer"
        assert data[key] >= 0, f"Key '{key}' must be non-negative"


@pytest.mark.asyncio
async def test_admin_stats_accuracy_with_data(
    client: AsyncClient, db_session
) -> None:
    """Verify that created entities are accurately counted in the admin stats."""
    # 1. Register an Admin
    admin_user, admin_headers = await create_user_with_role(
        db_session,
        full_name="Counting Admin",
        email="counting.admin@university.edu",
        role=UserRole.ADMIN,
    )

    # 2. Register 2 Students
    await create_user_with_role(
        db_session, "Student Alpha", "alpha.student@university.edu", UserRole.STUDENT
    )
    await create_user_with_role(
        db_session, "Student Beta", "beta.student@university.edu", UserRole.STUDENT
    )

    # 3. Register 1 Faculty
    await create_user_with_role(
        db_session, "Prof. Gauss", "gauss.prof@university.edu", UserRole.FACULTY
    )

    # 4. Create Department and Course
    dept = Department(code="MATH", name="Mathematics Department")
    db_session.add(dept)
    await db_session.flush()

    course = Course(code="MATH101", name="Calculus I", department_id=dept.id)
    db_session.add(course)

    # 5. Create Event and Club
    event = Event(
        title="Math Olympiad",
        description="Campus competition",
        date_time=datetime.now(UTC),
        location="Hall A",
        created_by=admin_user.id,
    )
    db_session.add(event)

    club = Club(
        name="Math Club",
        description="Math enthusiasts",
        category="Academic",
    )
    db_session.add(club)

    # 6. Create Complaints (1 OPEN, 1 RESOLVED)
    c_open = Complaint(
        title="AC Broken",
        description="AC in lab not working",
        category="Maintenance",
        location="Lab 1",
        status=ComplaintStatus.OPEN,
        created_by=admin_user.id,
    )
    c_resolved = Complaint(
        title="Light bulb fused",
        description="Bulb replaced",
        category="Electrical",
        location="Room 2",
        status=ComplaintStatus.RESOLVED,
        created_by=admin_user.id,
    )
    db_session.add(c_open)
    db_session.add(c_resolved)

    # 7. Create Internship
    internship = Internship(
        title="Research Intern",
        company="LabCorp",
        description="Summer internship",
        required_skills="Python, SQL",
        location="Remote",
        created_by=admin_user.id,
    )
    db_session.add(internship)

    await db_session.commit()

    # 8. Query admin stats
    response = await client.get("/api/v1/admin/stats", headers=admin_headers)
    assert response.status_code == 200
    stats = response.json()

    assert stats["students"] >= 2
    assert stats["faculty"] >= 1
    assert stats["courses"] >= 1
    assert stats["events"] >= 1
    assert stats["clubs"] >= 1
    assert stats["complaints"] >= 2
    assert stats["open_complaints"] >= 1
    assert stats["internships"] >= 1
