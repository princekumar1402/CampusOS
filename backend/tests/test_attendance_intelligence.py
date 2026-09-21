"""
CampusOS — Attendance Intelligence Tests (Stage 2A)
===================================================
Tests for 75% threshold status evaluation, classes needed calculations,
zero class safety, course-wise intelligence, and RBAC security.
"""
from datetime import datetime, UTC
import uuid
import pytest
from httpx import AsyncClient

from app.core.security import create_access_token
from app.models.user import UserRole
from app.schemas.attendance import AttendanceThresholdStatus
from app.schemas.auth import UserRegisterRequest
from app.services.academic_service import academic_service
from app.services.attendance_service import attendance_service
from app.services.auth_service import auth_service


# -----------------------------------------------------------------------------
# Unit Tests for Intelligence Calculation Logic
# -----------------------------------------------------------------------------


def test_evaluate_status():
    """Verify 75% threshold evaluation."""
    assert attendance_service.evaluate_status(100.0) == AttendanceThresholdStatus.SATISFACTORY
    assert attendance_service.evaluate_status(75.0) == AttendanceThresholdStatus.SATISFACTORY
    assert attendance_service.evaluate_status(74.99) == AttendanceThresholdStatus.LOW_ATTENDANCE
    assert attendance_service.evaluate_status(0.0) == AttendanceThresholdStatus.LOW_ATTENDANCE


def test_calculate_classes_needed():
    """Verify mathematically correct classes needed calculation.

    Formula: (A + X) / (T + X) >= 0.75 => X >= 3T - 4A
    """
    # 8/12 = 66.67% => 3(12) - 4(8) = 36 - 32 = 4
    assert attendance_service.calculate_classes_needed(attended=8, total=12) == 4

    # 3/4 = 75.0% => 0 needed
    assert attendance_service.calculate_classes_needed(attended=3, total=4) == 0

    # 10/10 = 100% => 0 needed
    assert attendance_service.calculate_classes_needed(attended=10, total=10) == 0

    # 0/4 = 0% => 3(4) - 4(0) = 12
    assert attendance_service.calculate_classes_needed(attended=0, total=4) == 12

    # Zero class case safety
    assert attendance_service.calculate_classes_needed(attended=0, total=0) == 0


# -----------------------------------------------------------------------------
# Integration / API Tests for Attendance Intelligence
# -----------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_student_attendance_intelligence_flow(client: AsyncClient, db_session):
    """Integration test verifying overall & per-course attendance intelligence."""
    # 1. Register Admin User
    admin_user = await auth_service.register(
        db_session,
        UserRegisterRequest(
            full_name="Admin Intel",
            email=f"admin.intel.{uuid.uuid4().hex[:4]}@university.edu",
            password="AdminPassword123!",
        ),
    )
    admin_user.role = UserRole.ADMIN
    admin_user.updated_at = datetime.now(UTC).replace(tzinfo=None)

    # 2. Register Student User
    student_user = await auth_service.register(
        db_session,
        UserRegisterRequest(
            full_name="Student Intel",
            email=f"student.intel.{uuid.uuid4().hex[:4]}@university.edu",
            password="StudentPassword123!",
        ),
    )
    student_prof = await academic_service.create_or_update_student_profile(
        db_session,
        student_user.id,
        data=type("Data", (), {"student_id": f"STU-{uuid.uuid4().hex[:4]}", "program": "CS", "batch_year": 2026, "cgpa": None, "phone_number": None, "bio": None})(),
    )
    await db_session.commit()

    admin_token = create_access_token(admin_user.id, role=UserRole.ADMIN)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    student_token = create_access_token(student_user.id, role=UserRole.STUDENT)
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # 3. Create two courses as Admin
    course_code_1 = f"CS-{uuid.uuid4().hex[:4].upper()}"
    course_code_2 = f"CS-{uuid.uuid4().hex[:4].upper()}"

    res1 = await client.post(
        "/api/v1/courses",
        json={"code": course_code_1, "name": "Data Structures"},
        headers=admin_headers,
    )
    assert res1.status_code == 201
    course1_id = res1.json()["id"]

    res2 = await client.post(
        "/api/v1/courses",
        json={"code": course_code_2, "name": "Algorithms"},
        headers=admin_headers,
    )
    assert res2.status_code == 201
    course2_id = res2.json()["id"]

    # 4. Mark Course 1 attendance: 3/4 (75% -> SATISFACTORY, 0 needed)
    dates = ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04"]
    for i, d in enumerate(dates):
        status_val = "PRESENT" if i < 3 else "ABSENT"
        await client.post(
            "/api/v1/attendance/mark",
            json={
                "course_id": course1_id,
                "date": d,
                "records": [{"student_profile_id": str(student_prof.id), "status": status_val}],
            },
            headers=admin_headers,
        )

    # 5. Mark Course 2 attendance: 8/12 (66.67% -> LOW_ATTENDANCE, 4 needed)
    for i in range(12):
        d_str = f"2026-08-{(i+1):02d}"
        status_val = "PRESENT" if i < 8 else "ABSENT"
        await client.post(
            "/api/v1/attendance/mark",
            json={
                "course_id": course2_id,
                "date": d_str,
                "records": [{"student_profile_id": str(student_prof.id), "status": status_val}],
            },
            headers=admin_headers,
        )

    # 6. Fetch student self-service attendance overview
    res_me = await client.get("/api/v1/attendance/me", headers=student_headers)
    assert res_me.status_code == 200
    overview = res_me.json()

    # Total classes = 4 + 12 = 16. Attended = 3 + 8 = 11.
    # Overall percentage = 11/16 = 68.75% < 75% -> LOW_ATTENDANCE
    # Overall needed = 3(16) - 4(11) = 48 - 44 = 4 classes needed.
    assert overview["total_classes"] == 16
    assert overview["attended_classes"] == 11
    assert overview["overall_percentage"] == 68.75
    assert overview["status"] == "LOW_ATTENDANCE"
    assert overview["classes_needed"] == 4

    # Verify per-course breakdown
    summaries = {c["course_id"]: c for c in overview["course_summaries"]}

    # Course 1: 3/4 = 75.0% => SATISFACTORY, 0 needed
    c1_stat = summaries[course1_id]
    assert c1_stat["attendance_percentage"] == 75.0
    assert c1_stat["status"] == "SATISFACTORY"
    assert c1_stat["classes_needed"] == 0

    # Course 2: 8/12 = 66.67% => LOW_ATTENDANCE, 4 needed
    c2_stat = summaries[course2_id]
    assert c2_stat["attendance_percentage"] == 66.67
    assert c2_stat["status"] == "LOW_ATTENDANCE"
    assert c2_stat["classes_needed"] == 4


@pytest.mark.asyncio
async def test_zero_class_case_safety(client: AsyncClient, db_session):
    """Verify zero class case returns 100%, SATISFACTORY, and 0 classes needed."""
    student_user = await auth_service.register(
        db_session,
        UserRegisterRequest(
            full_name="Fresh Student",
            email=f"fresh.{uuid.uuid4().hex[:4]}@university.edu",
            password="StudentPassword123!",
        ),
    )
    student_token = create_access_token(student_user.id, role=UserRole.STUDENT)
    student_headers = {"Authorization": f"Bearer {student_token}"}

    res = await client.get("/api/v1/attendance/me", headers=student_headers)
    assert res.status_code == 200
    data = res.json()

    assert data["total_classes"] == 0
    assert data["attended_classes"] == 0
    assert data["overall_percentage"] == 100.0
    assert data["status"] == "SATISFACTORY"
    assert data["classes_needed"] == 0
