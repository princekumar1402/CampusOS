"""
CampusOS — Day 4 CampusFix Complaints & Notifications Tests
===========================================================
Focused test suite for:
1. Student creates complaint
2. Complaint starts OPEN
3. Student sees own complaints
4. Student cannot access another student's complaint
5. Admin sees all complaints
6. Admin changes OPEN -> IN_PROGRESS
7. Admin changes IN_PROGRESS -> RESOLVED
8. Student cannot change status
9. Invalid status transition rejected
10. Notification created after status change
11. Student sees own notifications
12. Student marks notification as read
13. Student cannot modify another user's notification
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
import pytest
from httpx import AsyncClient

from app.core.security import create_access_token
from app.models.user import User, UserRole
from app.schemas.auth import UserRegisterRequest
from app.services.auth_service import auth_service


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


@pytest.mark.asyncio
async def test_student_creates_complaint(client: AsyncClient, db_session) -> None:
    """1. Student creates complaint."""
    _, student_headers = await create_test_user(
        db_session, "Alice Fix", "alice.fix@university.edu", UserRole.STUDENT
    )
    res = await client.post(
        "/api/v1/complaints",
        json={
            "title": "Broken projector in Room 301",
            "description": "The HDMI port is loose and display flickers continuously.",
            "category": "IT Support",
            "location": "Academic Block A, Room 301",
        },
        headers=student_headers,
    )
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "Broken projector in Room 301"
    assert data["category"] == "IT Support"
    assert data["location"] == "Academic Block A, Room 301"
    assert "id" in data


@pytest.mark.asyncio
async def test_complaint_starts_open(client: AsyncClient, db_session) -> None:
    """2. Complaint starts OPEN by default."""
    _, student_headers = await create_test_user(
        db_session, "Bob Fix", "bob.fix@university.edu", UserRole.STUDENT
    )
    res = await client.post(
        "/api/v1/complaints",
        json={
            "title": "Water leak in 2nd floor restroom",
            "description": "Tap is dripping heavily.",
            "category": "Maintenance",
            "location": "Hostel 4, 2nd Floor",
        },
        headers=student_headers,
    )
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "OPEN"


@pytest.mark.asyncio
async def test_student_sees_own_complaints(client: AsyncClient, db_session) -> None:
    """3. Student sees own complaints."""
    _, student1_headers = await create_test_user(
        db_session, "Student One", "stu1.fix@university.edu", UserRole.STUDENT
    )
    _, student2_headers = await create_test_user(
        db_session, "Student Two", "stu2.fix@university.edu", UserRole.STUDENT
    )

    # Student 1 creates 2 complaints
    await client.post(
        "/api/v1/complaints",
        json={"title": "Issue 1", "description": "Desc 1", "category": "General", "location": "Hall A"},
        headers=student1_headers,
    )
    await client.post(
        "/api/v1/complaints",
        json={"title": "Issue 2", "description": "Desc 2", "category": "General", "location": "Hall B"},
        headers=student1_headers,
    )

    # Student 2 creates 1 complaint
    await client.post(
        "/api/v1/complaints",
        json={"title": "Issue 3", "description": "Desc 3", "category": "General", "location": "Hall C"},
        headers=student2_headers,
    )

    # Check Student 1
    res1 = await client.get("/api/v1/complaints/me", headers=student1_headers)
    assert res1.status_code == 200
    complaints1 = res1.json()
    assert len(complaints1) == 2
    assert {c["title"] for c in complaints1} == {"Issue 1", "Issue 2"}

    # Check Student 2
    res2 = await client.get("/api/v1/complaints/me", headers=student2_headers)
    assert res2.status_code == 200
    complaints2 = res2.json()
    assert len(complaints2) == 1
    assert complaints2[0]["title"] == "Issue 3"


@pytest.mark.asyncio
async def test_student_cannot_access_another_student_complaint(client: AsyncClient, db_session) -> None:
    """4. Student cannot access another student's complaint (403 Forbidden)."""
    _, student1_headers = await create_test_user(
        db_session, "Student Alpha", "alpha.fix@university.edu", UserRole.STUDENT
    )
    _, student2_headers = await create_test_user(
        db_session, "Student Beta", "beta.fix@university.edu", UserRole.STUDENT
    )

    create_res = await client.post(
        "/api/v1/complaints",
        json={"title": "Private Issue", "description": "Room issue", "category": "Hostel", "location": "Room 10"},
        headers=student1_headers,
    )
    complaint_id = create_res.json()["id"]

    # Student 2 tries to view Student 1's complaint
    res = await client.get(f"/api/v1/complaints/{complaint_id}", headers=student2_headers)
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_admin_sees_all_complaints(client: AsyncClient, db_session) -> None:
    """5. Admin sees all complaints across users."""
    _, s1_headers = await create_test_user(
        db_session, "S1", "s1.adminsee@university.edu", UserRole.STUDENT
    )
    _, s2_headers = await create_test_user(
        db_session, "S2", "s2.adminsee@university.edu", UserRole.STUDENT
    )
    _, admin_headers = await create_test_user(
        db_session, "Admin Boss", "admin.seeall@university.edu", UserRole.ADMIN
    )

    await client.post(
        "/api/v1/complaints",
        json={"title": "Complaint from S1", "description": "D1", "category": "Cat", "location": "Loc 1"},
        headers=s1_headers,
    )
    await client.post(
        "/api/v1/complaints",
        json={"title": "Complaint from S2", "description": "D2", "category": "Cat", "location": "Loc 2"},
        headers=s2_headers,
    )

    res = await client.get("/api/v1/complaints", headers=admin_headers)
    assert res.status_code == 200
    all_complaints = res.json()
    assert len(all_complaints) >= 2
    titles = [c["title"] for c in all_complaints]
    assert "Complaint from S1" in titles
    assert "Complaint from S2" in titles


@pytest.mark.asyncio
async def test_admin_changes_open_to_in_progress(client: AsyncClient, db_session) -> None:
    """6. Admin changes OPEN -> IN_PROGRESS."""
    _, s_headers = await create_test_user(
        db_session, "Student Change", "change.stu@university.edu", UserRole.STUDENT
    )
    _, admin_headers = await create_test_user(
        db_session, "Admin Change", "change.adm@university.edu", UserRole.ADMIN
    )

    create_res = await client.post(
        "/api/v1/complaints",
        json={"title": "WiFi disconnected", "description": "Library floor 2", "category": "IT", "location": "Library"},
        headers=s_headers,
    )
    complaint_id = create_res.json()["id"]

    patch_res = await client.patch(
        f"/api/v1/complaints/{complaint_id}/status",
        json={"status": "IN_PROGRESS"},
        headers=admin_headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "IN_PROGRESS"


@pytest.mark.asyncio
async def test_admin_changes_in_progress_to_resolved(client: AsyncClient, db_session) -> None:
    """7. Admin changes IN_PROGRESS -> RESOLVED."""
    _, s_headers = await create_test_user(
        db_session, "Student Resolv", "resolv.stu@university.edu", UserRole.STUDENT
    )
    _, admin_headers = await create_test_user(
        db_session, "Admin Resolv", "resolv.adm@university.edu", UserRole.ADMIN
    )

    create_res = await client.post(
        "/api/v1/complaints",
        json={"title": "Broken light", "description": "Lab corridor", "category": "Electrical", "location": "Lab C"},
        headers=s_headers,
    )
    complaint_id = create_res.json()["id"]

    # First advance to IN_PROGRESS
    p1 = await client.patch(
        f"/api/v1/complaints/{complaint_id}/status",
        json={"status": "IN_PROGRESS"},
        headers=admin_headers,
    )
    assert p1.status_code == 200

    # Next advance to RESOLVED
    p2 = await client.patch(
        f"/api/v1/complaints/{complaint_id}/status",
        json={"status": "RESOLVED"},
        headers=admin_headers,
    )
    assert p2.status_code == 200
    assert p2.json()["status"] == "RESOLVED"


@pytest.mark.asyncio
async def test_student_cannot_change_status(client: AsyncClient, db_session) -> None:
    """8. Student cannot change status (403 Forbidden)."""
    _, s_headers = await create_test_user(
        db_session, "Student CantChange", "cantchange.stu@university.edu", UserRole.STUDENT
    )
    create_res = await client.post(
        "/api/v1/complaints",
        json={"title": "AC not cooling", "description": "Room 101", "category": "Maintenance", "location": "Room 101"},
        headers=s_headers,
    )
    complaint_id = create_res.json()["id"]

    patch_res = await client.patch(
        f"/api/v1/complaints/{complaint_id}/status",
        json={"status": "IN_PROGRESS"},
        headers=s_headers,
    )
    assert patch_res.status_code == 403


@pytest.mark.asyncio
async def test_invalid_status_transition_rejected(client: AsyncClient, db_session) -> None:
    """9. Invalid status transitions rejected (OPEN -> RESOLVED, RESOLVED -> anything, IN_PROGRESS -> OPEN)."""
    _, s_headers = await create_test_user(
        db_session, "Student Inval", "inval.stu@university.edu", UserRole.STUDENT
    )
    _, admin_headers = await create_test_user(
        db_session, "Admin Inval", "inval.adm@university.edu", UserRole.ADMIN
    )

    create_res = await client.post(
        "/api/v1/complaints",
        json={"title": "Desk broken", "description": "Seat 12", "category": "Furniture", "location": "Room 205"},
        headers=s_headers,
    )
    complaint_id = create_res.json()["id"]

    # Reject OPEN -> RESOLVED
    res_direct = await client.patch(
        f"/api/v1/complaints/{complaint_id}/status",
        json={"status": "RESOLVED"},
        headers=admin_headers,
    )
    assert res_direct.status_code == 422

    # Advance to IN_PROGRESS
    await client.patch(
        f"/api/v1/complaints/{complaint_id}/status",
        json={"status": "IN_PROGRESS"},
        headers=admin_headers,
    )

    # Reject IN_PROGRESS -> OPEN
    res_back = await client.patch(
        f"/api/v1/complaints/{complaint_id}/status",
        json={"status": "OPEN"},
        headers=admin_headers,
    )
    assert res_back.status_code == 422

    # Advance to RESOLVED
    await client.patch(
        f"/api/v1/complaints/{complaint_id}/status",
        json={"status": "RESOLVED"},
        headers=admin_headers,
    )

    # Reject RESOLVED -> anything
    res_after_resolved = await client.patch(
        f"/api/v1/complaints/{complaint_id}/status",
        json={"status": "IN_PROGRESS"},
        headers=admin_headers,
    )
    assert res_after_resolved.status_code == 422


@pytest.mark.asyncio
async def test_notification_created_after_status_change(client: AsyncClient, db_session) -> None:
    """10. Notification created after admin changes complaint status."""
    student, s_headers = await create_test_user(
        db_session, "Notify Student", "notify.stu@university.edu", UserRole.STUDENT
    )
    _, admin_headers = await create_test_user(
        db_session, "Notify Admin", "notify.adm@university.edu", UserRole.ADMIN
    )

    create_res = await client.post(
        "/api/v1/complaints",
        json={"title": "Water Leak", "description": "Heavy leak", "category": "Plumbing", "location": "Block 2"},
        headers=s_headers,
    )
    complaint_id = create_res.json()["id"]

    # Status change 1: OPEN -> IN_PROGRESS
    await client.patch(
        f"/api/v1/complaints/{complaint_id}/status",
        json={"status": "IN_PROGRESS"},
        headers=admin_headers,
    )

    n_res1 = await client.get("/api/v1/notifications", headers=s_headers)
    assert n_res1.status_code == 200
    notes1 = n_res1.json()
    assert len(notes1) == 1
    assert notes1[0]["message"] == "Your complaint 'Water Leak' is now IN_PROGRESS."
    assert notes1[0]["is_read"] is False

    # Status change 2: IN_PROGRESS -> RESOLVED
    await client.patch(
        f"/api/v1/complaints/{complaint_id}/status",
        json={"status": "RESOLVED"},
        headers=admin_headers,
    )

    n_res2 = await client.get("/api/v1/notifications", headers=s_headers)
    assert n_res2.status_code == 200
    notes2 = n_res2.json()
    assert len(notes2) == 2
    messages = [n["message"] for n in notes2]
    assert "Your complaint 'Water Leak' has been resolved." in messages


@pytest.mark.asyncio
async def test_student_sees_own_notifications(client: AsyncClient, db_session) -> None:
    """11. Student sees only their own notifications."""
    _, s1_headers = await create_test_user(
        db_session, "Student N1", "n1.stu@university.edu", UserRole.STUDENT
    )
    _, s2_headers = await create_test_user(
        db_session, "Student N2", "n2.stu@university.edu", UserRole.STUDENT
    )
    _, admin_headers = await create_test_user(
        db_session, "Admin Notifier", "n.adm@university.edu", UserRole.ADMIN
    )

    # Student 1 creates complaint and Admin updates it
    c1 = await client.post(
        "/api/v1/complaints",
        json={"title": "S1 Issue", "description": "S1 Desc", "category": "IT", "location": "Loc"},
        headers=s1_headers,
    )
    await client.patch(
        f"/api/v1/complaints/{c1.json()['id']}/status",
        json={"status": "IN_PROGRESS"},
        headers=admin_headers,
    )

    # S1 has 1 notification
    n1 = await client.get("/api/v1/notifications", headers=s1_headers)
    assert len(n1.json()) == 1

    # S2 has 0 notifications
    n2 = await client.get("/api/v1/notifications", headers=s2_headers)
    assert len(n2.json()) == 0


@pytest.mark.asyncio
async def test_student_marks_notification_as_read(client: AsyncClient, db_session) -> None:
    """12. Student marks notification as read."""
    _, s_headers = await create_test_user(
        db_session, "Read Student", "read.stu@university.edu", UserRole.STUDENT
    )
    _, admin_headers = await create_test_user(
        db_session, "Read Admin", "read.adm@university.edu", UserRole.ADMIN
    )

    c = await client.post(
        "/api/v1/complaints",
        json={"title": "Read Test", "description": "Desc", "category": "General", "location": "Room"},
        headers=s_headers,
    )
    await client.patch(
        f"/api/v1/complaints/{c.json()['id']}/status",
        json={"status": "IN_PROGRESS"},
        headers=admin_headers,
    )

    notifications = (await client.get("/api/v1/notifications", headers=s_headers)).json()
    notif_id = notifications[0]["id"]
    assert notifications[0]["is_read"] is False

    patch_res = await client.patch(
        f"/api/v1/notifications/{notif_id}/read",
        headers=s_headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["is_read"] is True

    # Verify via get
    updated_notifications = (await client.get("/api/v1/notifications", headers=s_headers)).json()
    assert updated_notifications[0]["is_read"] is True


@pytest.mark.asyncio
async def test_student_cannot_modify_another_user_notification(client: AsyncClient, db_session) -> None:
    """13. Student cannot modify another user's notification (403 Forbidden)."""
    _, s1_headers = await create_test_user(
        db_session, "User A", "usera@university.edu", UserRole.STUDENT
    )
    _, s2_headers = await create_test_user(
        db_session, "User B", "userb@university.edu", UserRole.STUDENT
    )
    _, admin_headers = await create_test_user(
        db_session, "Admin X", "adminx@university.edu", UserRole.ADMIN
    )

    # S1's complaint is updated
    c = await client.post(
        "/api/v1/complaints",
        json={"title": "A's Complaint", "description": "Desc", "category": "General", "location": "Room"},
        headers=s1_headers,
    )
    await client.patch(
        f"/api/v1/complaints/{c.json()['id']}/status",
        json={"status": "IN_PROGRESS"},
        headers=admin_headers,
    )

    notif_id = (await client.get("/api/v1/notifications", headers=s1_headers)).json()[0]["id"]

    # S2 tries to mark S1's notification as read
    res = await client.patch(
        f"/api/v1/notifications/{notif_id}/read",
        headers=s2_headers,
    )
    assert res.status_code == 403
