"""
CampusOS — Day 2 Stage 1 Attendance MVP Tests
==============================================
Test suite for Course creation, Attendance marking, RBAC guards,
duplicate prevention, and percentage formula calculation.
"""
from __future__ import annotations

from datetime import date, datetime, UTC
import pytest
from httpx import AsyncClient

from app.core.security import create_access_token
from app.models.attendance import AttendanceStatus
from app.models.user import UserRole
from app.schemas.auth import UserRegisterRequest
from app.services.academic_service import academic_service
from app.services.auth_service import auth_service


@pytest.mark.asyncio
async def test_faculty_can_mark_attendance(client: AsyncClient, db_session) -> None:
    """Faculty member can create a course and mark attendance for a student."""
    faculty_user = await auth_service.register(
        db_session,
        UserRegisterRequest(
            full_name="Prof. Turing",
            email="turing.fac@university.edu",
            password="FacultyPassword123!",
        ),
    )
    faculty_user.role = UserRole.FACULTY
    faculty_user.updated_at = datetime.now(UTC).replace(tzinfo=None)

    student_user = await auth_service.register(
        db_session,
        UserRegisterRequest(
            full_name="Alice Student",
            email="alice.st@university.edu",
            password="StudentPassword123!",
        ),
    )

    student_prof = await academic_service.create_or_update_student_profile(
        db_session,
        student_user.id,
        data=type("Data", (), {"student_id": "STU-101", "program": "CS", "batch_year": 2026, "cgpa": None, "phone_number": None, "bio": None})(),
    )
    await db_session.commit()

    faculty_token = create_access_token(faculty_user.id, role=UserRole.FACULTY)
    faculty_headers = {"Authorization": f"Bearer {faculty_token}"}

    c_res = await client.post(
        "/api/v1/courses",
        json={"code": "CS101", "name": "Intro to Computer Science"},
        headers=faculty_headers,
    )
    assert c_res.status_code == 201
    course_id = c_res.json()["id"]

    today = str(date.today())
    mark_res = await client.post(
        "/api/v1/attendance/mark",
        json={
            "course_id": course_id,
            "date": today,
            "records": [
                {"student_profile_id": str(student_prof.id), "status": "PRESENT", "remarks": "On time"}
            ],
        },
        headers=faculty_headers,
    )
    assert mark_res.status_code == 200
    records = mark_res.json()
    assert len(records) == 1
    assert records[0]["status"] == "PRESENT"


@pytest.mark.asyncio
async def test_admin_can_manage_attendance(client: AsyncClient, db_session) -> None:
    """Admin user can create course and view course attendance sheet."""
    admin_user = await auth_service.register(
        db_session,
        UserRegisterRequest(
            full_name="Admin Boss",
            email="admin.boss@university.edu",
            password="AdminPassword123!",
        ),
    )
    admin_user.role = UserRole.ADMIN
    admin_user.updated_at = datetime.now(UTC).replace(tzinfo=None)
    await db_session.commit()

    admin_token = create_access_token(admin_user.id, role=UserRole.ADMIN)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    c_res = await client.post(
        "/api/v1/courses",
        json={"code": "MATH201", "name": "Linear Algebra"},
        headers=admin_headers,
    )
    assert c_res.status_code == 201
    course_id = c_res.json()["id"]

    sheet_res = await client.get(f"/api/v1/attendance/course/{course_id}", headers=admin_headers)
    assert sheet_res.status_code == 200
    assert len(sheet_res.json()) == 0


@pytest.mark.asyncio
async def test_student_can_view_own_attendance(client: AsyncClient, db_session) -> None:
    """Student can retrieve personal attendance summary & history."""
    student_user = await auth_service.register(
        db_session,
        UserRegisterRequest(
            full_name="Bob Student",
            email="bob.st@university.edu",
            password="StudentPassword123!",
        ),
    )
    student_token = create_access_token(student_user.id, role=UserRole.STUDENT)
    headers = {"Authorization": f"Bearer {student_token}"}

    res = await client.get("/api/v1/attendance/me", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "overall_percentage" in data
    assert data["overall_percentage"] == 100.0


@pytest.mark.asyncio
async def test_student_cannot_mark_attendance(client: AsyncClient, db_session) -> None:
    """Student attempting to mark attendance receives HTTP 403 Forbidden."""
    student_user = await auth_service.register(
        db_session,
        UserRegisterRequest(
            full_name="Eve Attacker",
            email="eve.att@university.edu",
            password="StudentPassword123!",
        ),
    )
    student_token = create_access_token(student_user.id, role=UserRole.STUDENT)
    headers = {"Authorization": f"Bearer {student_token}"}

    res = await client.post(
        "/api/v1/attendance/mark",
        json={
            "course_id": "00000000-0000-0000-0000-000000000000",
            "date": str(date.today()),
            "records": [{"student_profile_id": str(student_user.id), "status": "PRESENT"}],
        },
        headers=headers,
    )
    assert res.status_code == 403
    assert res.json()["error"] == "ForbiddenError"


@pytest.mark.asyncio
async def test_student_cannot_view_another_student_attendance(client: AsyncClient, db_session) -> None:
    """Student attempting to view course attendance register receives HTTP 403 Forbidden."""
    student_user = await auth_service.register(
        db_session,
        UserRegisterRequest(
            full_name="Charlie Student",
            email="charlie.st@university.edu",
            password="StudentPassword123!",
        ),
    )
    student_token = create_access_token(student_user.id, role=UserRole.STUDENT)
    headers = {"Authorization": f"Bearer {student_token}"}

    res = await client.get("/api/v1/attendance/course/00000000-0000-0000-0000-000000000000", headers=headers)
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_duplicate_attendance_prevented(client: AsyncClient, db_session) -> None:
    """Marking attendance twice for same student/course/date updates existing record without duplicate error."""
    faculty_user = await auth_service.register(
        db_session,
        UserRegisterRequest(full_name="Prof. Smith", email="smith.fac@university.edu", password="Password123!"),
    )
    faculty_user.role = UserRole.FACULTY
    faculty_user.updated_at = datetime.now(UTC).replace(tzinfo=None)

    student_user = await auth_service.register(
        db_session,
        UserRegisterRequest(full_name="Dave Student", email="dave.st@university.edu", password="Password123!"),
    )
    student_prof = await academic_service.create_or_update_student_profile(
        db_session, student_user.id, data=type("Data", (), {"student_id": "STU-105", "program": "CS", "batch_year": 2026, "cgpa": None, "phone_number": None, "bio": None})()
    )
    await db_session.commit()

    faculty_token = create_access_token(faculty_user.id, role=UserRole.FACULTY)
    faculty_headers = {"Authorization": f"Bearer {faculty_token}"}

    c_res = await client.post("/api/v1/courses", json={"code": "PHYS101", "name": "Physics I"}, headers=faculty_headers)
    course_id = c_res.json()["id"]

    today = str(date.today())
    await client.post(
        "/api/v1/attendance/mark",
        json={"course_id": course_id, "date": today, "records": [{"student_profile_id": str(student_prof.id), "status": "PRESENT"}]},
        headers=faculty_headers,
    )

    mark2 = await client.post(
        "/api/v1/attendance/mark",
        json={"course_id": course_id, "date": today, "records": [{"student_profile_id": str(student_prof.id), "status": "ABSENT"}]},
        headers=faculty_headers,
    )
    assert mark2.status_code == 200
    assert mark2.json()[0]["status"] == "ABSENT"


@pytest.mark.asyncio
async def test_attendance_percentage_calculation(client: AsyncClient, db_session) -> None:
    """Asserts percentage calculation formula: (attended / total) * 100."""
    faculty_user = await auth_service.register(
        db_session,
        UserRegisterRequest(full_name="Prof. Jones", email="jones.fac@university.edu", password="Password123!"),
    )
    faculty_user.role = UserRole.FACULTY
    faculty_user.updated_at = datetime.now(UTC).replace(tzinfo=None)

    student_user = await auth_service.register(
        db_session,
        UserRegisterRequest(full_name="Frank Student", email="frank.st@university.edu", password="Password123!"),
    )
    student_prof = await academic_service.create_or_update_student_profile(
        db_session, student_user.id, data=type("Data", (), {"student_id": "STU-109", "program": "CS", "batch_year": 2026, "cgpa": None, "phone_number": None, "bio": None})()
    )
    await db_session.commit()

    faculty_token = create_access_token(faculty_user.id, role=UserRole.FACULTY)
    faculty_headers = {"Authorization": f"Bearer {faculty_token}"}

    c_res = await client.post("/api/v1/courses", json={"code": "ENG101", "name": "English Composition"}, headers=faculty_headers)
    course_id = c_res.json()["id"]

    await client.post(
        "/api/v1/attendance/mark",
        json={"course_id": course_id, "date": "2026-09-01", "records": [{"student_profile_id": str(student_prof.id), "status": "PRESENT"}]},
        headers=faculty_headers,
    )
    await client.post(
        "/api/v1/attendance/mark",
        json={"course_id": course_id, "date": "2026-09-02", "records": [{"student_profile_id": str(student_prof.id), "status": "ABSENT"}]},
        headers=faculty_headers,
    )

    student_token = create_access_token(student_user.id, role=UserRole.STUDENT)
    student_headers = {"Authorization": f"Bearer {student_token}"}

    me_res = await client.get("/api/v1/attendance/me", headers=student_headers)
    assert me_res.status_code == 200
    data = me_res.json()

    assert data["total_classes"] == 2
    assert data["attended_classes"] == 1
    assert data["overall_percentage"] == 50.0


@pytest.mark.asyncio
async def test_faculty_can_get_course_attendance_sheet_with_records(client: AsyncClient, db_session) -> None:
    """Faculty can view course attendance register with existing records serialized without 500 error."""
    faculty_user = await auth_service.register(
        db_session,
        UserRegisterRequest(full_name="Prof. Hopper", email="hopper.fac@university.edu", password="Password123!"),
    )
    faculty_user.role = UserRole.FACULTY
    faculty_user.updated_at = datetime.now(UTC).replace(tzinfo=None)

    student_user = await auth_service.register(
        db_session,
        UserRegisterRequest(full_name="Grace Student", email="grace.st@university.edu", password="Password123!"),
    )
    student_prof = await academic_service.create_or_update_student_profile(
        db_session, student_user.id, data=type("Data", (), {"student_id": "STU-110", "program": "CS", "batch_year": 2026, "cgpa": None, "phone_number": None, "bio": None})()
    )
    await db_session.commit()

    faculty_token = create_access_token(faculty_user.id, role=UserRole.FACULTY)
    faculty_headers = {"Authorization": f"Bearer {faculty_token}"}

    c_res = await client.post("/api/v1/courses", json={"code": "CS202", "name": "Computer Architecture"}, headers=faculty_headers)
    assert c_res.status_code == 201
    course_id = c_res.json()["id"]

    mark_res = await client.post(
        "/api/v1/attendance/mark",
        json={"course_id": course_id, "date": "2026-09-10", "records": [{"student_profile_id": str(student_prof.id), "status": "PRESENT"}]},
        headers=faculty_headers,
    )
    assert mark_res.status_code == 200

    sheet_res = await client.get(f"/api/v1/attendance/course/{course_id}", headers=faculty_headers)
    assert sheet_res.status_code == 200
    sheet_data = sheet_res.json()
    assert len(sheet_data) == 1
    assert sheet_data[0]["course_id"] == course_id
    assert sheet_data[0]["course"]["code"] == "CS202"
    assert sheet_data[0]["status"] == "PRESENT"


@pytest.mark.asyncio
async def test_course_attendance_sheet_date_filtering(client: AsyncClient, db_session) -> None:
    """Course attendance sheet endpoint correctly filters records when date query parameter is supplied."""
    faculty_user = await auth_service.register(
        db_session,
        UserRegisterRequest(full_name="Prof. Knuth", email="knuth.fac@university.edu", password="Password123!"),
    )
    faculty_user.role = UserRole.FACULTY
    faculty_user.updated_at = datetime.now(UTC).replace(tzinfo=None)

    student_user = await auth_service.register(
        db_session,
        UserRegisterRequest(full_name="Ada Student", email="ada.st@university.edu", password="Password123!"),
    )
    student_prof = await academic_service.create_or_update_student_profile(
        db_session, student_user.id, data=type("Data", (), {"student_id": "STU-111", "program": "CS", "batch_year": 2026, "cgpa": None, "phone_number": None, "bio": None})()
    )
    await db_session.commit()

    faculty_token = create_access_token(faculty_user.id, role=UserRole.FACULTY)
    faculty_headers = {"Authorization": f"Bearer {faculty_token}"}

    c_res = await client.post("/api/v1/courses", json={"code": "CS305", "name": "Advanced Algorithms"}, headers=faculty_headers)
    assert c_res.status_code == 201
    course_id = c_res.json()["id"]

    # Mark ABSENT on 2026-09-14
    await client.post(
        "/api/v1/attendance/mark",
        json={"course_id": course_id, "date": "2026-09-14", "records": [{"student_profile_id": str(student_prof.id), "status": "ABSENT"}]},
        headers=faculty_headers,
    )

    # Mark PRESENT on 2026-09-15
    await client.post(
        "/api/v1/attendance/mark",
        json={"course_id": course_id, "date": "2026-09-15", "records": [{"student_profile_id": str(student_prof.id), "status": "PRESENT"}]},
        headers=faculty_headers,
    )

    # 1. Query for 2026-09-14
    res_14 = await client.get(f"/api/v1/attendance/course/{course_id}?date=2026-09-14", headers=faculty_headers)
    assert res_14.status_code == 200
    records_14 = res_14.json()
    assert len(records_14) == 1
    assert records_14[0]["date"] == "2026-09-14"
    assert records_14[0]["status"] == "ABSENT"

    # 2. Query for 2026-09-15
    res_15 = await client.get(f"/api/v1/attendance/course/{course_id}?date=2026-09-15", headers=faculty_headers)
    assert res_15.status_code == 200
    records_15 = res_15.json()
    assert len(records_15) == 1
    assert records_15[0]["date"] == "2026-09-15"
    assert records_15[0]["status"] == "PRESENT"

    # 3. Query for 2026-09-16 (no records)
    res_16 = await client.get(f"/api/v1/attendance/course/{course_id}?date=2026-09-16", headers=faculty_headers)
    assert res_16.status_code == 200
    assert len(res_16.json()) == 0

    # 4. Query without date (returns all 2 records)
    res_all = await client.get(f"/api/v1/attendance/course/{course_id}", headers=faculty_headers)
    assert res_all.status_code == 200
    assert len(res_all.json()) == 2


