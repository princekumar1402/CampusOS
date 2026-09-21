"""
CampusOS — Day 3 Events & Clubs MVP Tests
========================================
Focused test suite for Events and Clubs:
1. List events
2. Get event
3. Authorized event creation
4. Student cannot create event
5. Student registration
6. Duplicate registration rejected
7. Student unregisters
8. My registrations
9. List clubs
10. Get club
11. Student joins club
12. Duplicate membership rejected
13. Student leaves club
14. Unauthorized creation rejected
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


# ===========================================================================
# Events Tests (1 to 8)
# ===========================================================================


@pytest.mark.asyncio
async def test_list_events(client: AsyncClient, db_session) -> None:
    """1. List events — returns empty list then populated list."""
    _, student_headers = await create_test_user(
        db_session, "Student One", "stu.list@university.edu", UserRole.STUDENT
    )
    res = await client.get("/api/v1/events", headers=student_headers)
    assert res.status_code == 200
    assert res.json() == []

    _, admin_headers = await create_test_user(
        db_session, "Admin One", "admin.list@university.edu", UserRole.ADMIN
    )
    create_res = await client.post(
        "/api/v1/events",
        json={
            "title": "Orientation 2026",
            "description": "Campus orientation event",
            "date_time": "2026-10-01T10:00:00Z",
            "location": "Auditorium A",
        },
        headers=admin_headers,
    )
    assert create_res.status_code == 201

    res_after = await client.get("/api/v1/events", headers=student_headers)
    assert res_after.status_code == 200
    events = res_after.json()
    assert len(events) == 1
    assert events[0]["title"] == "Orientation 2026"


@pytest.mark.asyncio
async def test_get_event(client: AsyncClient, db_session) -> None:
    """2. Get event details by ID."""
    _, faculty_headers = await create_test_user(
        db_session, "Prof Alan", "alan.event@university.edu", UserRole.FACULTY
    )
    create_res = await client.post(
        "/api/v1/events",
        json={
            "title": "AI Workshop",
            "description": "Deep learning intro",
            "date_time": "2026-10-15T14:00:00Z",
            "location": "Lab 3",
        },
        headers=faculty_headers,
    )
    assert create_res.status_code == 201
    event_id = create_res.json()["id"]

    _, student_headers = await create_test_user(
        db_session, "Student Get", "stu.get@university.edu", UserRole.STUDENT
    )
    get_res = await client.get(f"/api/v1/events/{event_id}", headers=student_headers)
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "AI Workshop"
    assert get_res.json()["location"] == "Lab 3"


@pytest.mark.asyncio
async def test_authorized_event_creation(client: AsyncClient, db_session) -> None:
    """3. Authorized event creation — both Faculty and Admin can create."""
    _, faculty_headers = await create_test_user(
        db_session, "Prof Grace", "grace.ev@university.edu", UserRole.FACULTY
    )
    res_fac = await client.post(
        "/api/v1/events",
        json={
            "title": "Compiler Design Talk",
            "description": "Guest lecture",
            "date_time": "2026-11-01T09:00:00Z",
            "location": "Seminar Hall",
        },
        headers=faculty_headers,
    )
    assert res_fac.status_code == 201
    assert res_fac.json()["title"] == "Compiler Design Talk"

    _, admin_headers = await create_test_user(
        db_session, "Admin Ev", "admin.ev@university.edu", UserRole.ADMIN
    )
    res_adm = await client.post(
        "/api/v1/events",
        json={
            "title": "Annual Tech Fest",
            "description": "Hackathons and tech exhibitions",
            "date_time": "2026-11-20T09:00:00Z",
            "location": "Main Grounds",
        },
        headers=admin_headers,
    )
    assert res_adm.status_code == 201
    assert res_adm.json()["title"] == "Annual Tech Fest"


@pytest.mark.asyncio
async def test_student_cannot_create_event(client: AsyncClient, db_session) -> None:
    """4. Student cannot create event — returns 403 Forbidden."""
    _, student_headers = await create_test_user(
        db_session, "Student Ev", "stu.cantcreate@university.edu", UserRole.STUDENT
    )
    res = await client.post(
        "/api/v1/events",
        json={
            "title": "Student Party",
            "date_time": "2026-10-31T20:00:00Z",
            "location": "Hostel Lounge",
        },
        headers=student_headers,
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_student_registration(client: AsyncClient, db_session) -> None:
    """5. Student can register for an event."""
    _, admin_headers = await create_test_user(
        db_session, "Admin Reg", "admin.reg@university.edu", UserRole.ADMIN
    )
    create_res = await client.post(
        "/api/v1/events",
        json={
            "title": "Career Fair 2026",
            "date_time": "2026-10-10T10:00:00Z",
            "location": "Campus Center",
        },
        headers=admin_headers,
    )
    event_id = create_res.json()["id"]

    _, student_headers = await create_test_user(
        db_session, "Bob Student", "bob.reg@university.edu", UserRole.STUDENT
    )
    reg_res = await client.post(f"/api/v1/events/{event_id}/register", headers=student_headers)
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert reg_data["event_id"] == event_id
    assert "student_profile_id" in reg_data
    assert "registered_at" in reg_data


@pytest.mark.asyncio
async def test_duplicate_registration_rejected(client: AsyncClient, db_session) -> None:
    """6. Duplicate event registration rejected with 409 Conflict."""
    _, admin_headers = await create_test_user(
        db_session, "Admin Dup", "admin.dup@university.edu", UserRole.ADMIN
    )
    create_res = await client.post(
        "/api/v1/events",
        json={
            "title": "Robotics Expo",
            "date_time": "2026-10-25T11:00:00Z",
            "location": "Robotics Lab",
        },
        headers=admin_headers,
    )
    event_id = create_res.json()["id"]

    _, student_headers = await create_test_user(
        db_session, "Carol Student", "carol.dup@university.edu", UserRole.STUDENT
    )
    reg1 = await client.post(f"/api/v1/events/{event_id}/register", headers=student_headers)
    assert reg1.status_code == 201

    reg2 = await client.post(f"/api/v1/events/{event_id}/register", headers=student_headers)
    assert reg2.status_code == 409


@pytest.mark.asyncio
async def test_student_unregisters(client: AsyncClient, db_session) -> None:
    """7. Student can unregister from an event."""
    _, admin_headers = await create_test_user(
        db_session, "Admin Unreg", "admin.unreg@university.edu", UserRole.ADMIN
    )
    create_res = await client.post(
        "/api/v1/events",
        json={
            "title": "Hackathon 2026",
            "date_time": "2026-11-05T09:00:00Z",
            "location": "Innovation Hub",
        },
        headers=admin_headers,
    )
    event_id = create_res.json()["id"]

    _, student_headers = await create_test_user(
        db_session, "David Student", "david.unreg@university.edu", UserRole.STUDENT
    )
    reg_res = await client.post(f"/api/v1/events/{event_id}/register", headers=student_headers)
    assert reg_res.status_code == 201

    del_res = await client.delete(f"/api/v1/events/{event_id}/register", headers=student_headers)
    assert del_res.status_code == 204

    # Unregistering again yields 404
    del_res_again = await client.delete(f"/api/v1/events/{event_id}/register", headers=student_headers)
    assert del_res_again.status_code == 404


@pytest.mark.asyncio
async def test_my_registrations(client: AsyncClient, db_session) -> None:
    """8. Student retrieves their registered events."""
    _, admin_headers = await create_test_user(
        db_session, "Admin MyReg", "admin.myreg@university.edu", UserRole.ADMIN
    )
    e1 = await client.post(
        "/api/v1/events",
        json={"title": "Event 1", "date_time": "2026-10-10T10:00:00Z", "location": "Room 1"},
        headers=admin_headers,
    )
    e2 = await client.post(
        "/api/v1/events",
        json={"title": "Event 2", "date_time": "2026-10-12T10:00:00Z", "location": "Room 2"},
        headers=admin_headers,
    )

    _, student_headers = await create_test_user(
        db_session, "Eva Student", "eva.myreg@university.edu", UserRole.STUDENT
    )

    # Initially empty
    my_res = await client.get("/api/v1/events/my-registrations", headers=student_headers)
    assert my_res.status_code == 200
    assert my_res.json() == []

    # Register for e1
    await client.post(f"/api/v1/events/{e1.json()['id']}/register", headers=student_headers)

    my_res_after = await client.get("/api/v1/events/my-registrations", headers=student_headers)
    assert my_res_after.status_code == 200
    regs = my_res_after.json()
    assert len(regs) == 1
    assert regs[0]["event_id"] == e1.json()["id"]


# ===========================================================================
# Clubs Tests (9 to 14)
# ===========================================================================


@pytest.mark.asyncio
async def test_list_clubs(client: AsyncClient, db_session) -> None:
    """9. List clubs — empty then populated."""
    _, student_headers = await create_test_user(
        db_session, "Frank Student", "frank.clubs@university.edu", UserRole.STUDENT
    )
    res = await client.get("/api/v1/clubs", headers=student_headers)
    assert res.status_code == 200
    assert res.json() == []

    _, admin_headers = await create_test_user(
        db_session, "Admin Club", "admin.clublist@university.edu", UserRole.ADMIN
    )
    create_res = await client.post(
        "/api/v1/clubs",
        json={
            "name": "Coding Club",
            "description": "Competitive programming and hackathons",
            "category": "Technology",
        },
        headers=admin_headers,
    )
    assert create_res.status_code == 201

    res_after = await client.get("/api/v1/clubs", headers=student_headers)
    assert res_after.status_code == 200
    clubs = res_after.json()
    assert len(clubs) == 1
    assert clubs[0]["name"] == "Coding Club"


@pytest.mark.asyncio
async def test_get_club(client: AsyncClient, db_session) -> None:
    """10. Get club details by ID."""
    _, admin_headers = await create_test_user(
        db_session, "Admin ClubDet", "admin.clubdet@university.edu", UserRole.ADMIN
    )
    create_res = await client.post(
        "/api/v1/clubs",
        json={
            "name": "Robotics Society",
            "description": "Hardware and robotics enthusiasts",
            "category": "Engineering",
        },
        headers=admin_headers,
    )
    assert create_res.status_code == 201
    club_id = create_res.json()["id"]

    _, student_headers = await create_test_user(
        db_session, "Grace Student", "grace.clubdet@university.edu", UserRole.STUDENT
    )
    get_res = await client.get(f"/api/v1/clubs/{club_id}", headers=student_headers)
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Robotics Society"
    assert get_res.json()["category"] == "Engineering"


@pytest.mark.asyncio
async def test_student_joins_club(client: AsyncClient, db_session) -> None:
    """11. Student joins a club."""
    _, admin_headers = await create_test_user(
        db_session, "Admin Join", "admin.join@university.edu", UserRole.ADMIN
    )
    create_res = await client.post(
        "/api/v1/clubs",
        json={
            "name": "Debate Society",
            "description": "Parliamentary debates and speech",
            "category": "Cultural",
        },
        headers=admin_headers,
    )
    club_id = create_res.json()["id"]

    _, student_headers = await create_test_user(
        db_session, "Henry Student", "henry.join@university.edu", UserRole.STUDENT
    )
    join_res = await client.post(f"/api/v1/clubs/{club_id}/join", headers=student_headers)
    assert join_res.status_code == 201
    membership = join_res.json()
    assert membership["club_id"] == club_id
    assert "student_profile_id" in membership
    assert "joined_at" in membership


@pytest.mark.asyncio
async def test_duplicate_membership_rejected(client: AsyncClient, db_session) -> None:
    """12. Duplicate club membership rejected with 409 Conflict."""
    _, admin_headers = await create_test_user(
        db_session, "Admin DupClub", "admin.dupclub@university.edu", UserRole.ADMIN
    )
    create_res = await client.post(
        "/api/v1/clubs",
        json={
            "name": "Music Club",
            "description": "Vocal and instrumental jams",
            "category": "Arts",
        },
        headers=admin_headers,
    )
    club_id = create_res.json()["id"]

    _, student_headers = await create_test_user(
        db_session, "Ivy Student", "ivy.dupclub@university.edu", UserRole.STUDENT
    )
    join1 = await client.post(f"/api/v1/clubs/{club_id}/join", headers=student_headers)
    assert join1.status_code == 201

    join2 = await client.post(f"/api/v1/clubs/{club_id}/join", headers=student_headers)
    assert join2.status_code == 409


@pytest.mark.asyncio
async def test_student_leaves_club(client: AsyncClient, db_session) -> None:
    """13. Student leaves a club."""
    _, admin_headers = await create_test_user(
        db_session, "Admin Leave", "admin.leave@university.edu", UserRole.ADMIN
    )
    create_res = await client.post(
        "/api/v1/clubs",
        json={
            "name": "Photography Club",
            "description": "Visual arts and photowalks",
            "category": "Arts",
        },
        headers=admin_headers,
    )
    club_id = create_res.json()["id"]

    _, student_headers = await create_test_user(
        db_session, "Jack Student", "jack.leave@university.edu", UserRole.STUDENT
    )
    join_res = await client.post(f"/api/v1/clubs/{club_id}/join", headers=student_headers)
    assert join_res.status_code == 201

    leave_res = await client.delete(f"/api/v1/clubs/{club_id}/join", headers=student_headers)
    assert leave_res.status_code == 204

    # Leaving again yields 404
    leave_again = await client.delete(f"/api/v1/clubs/{club_id}/join", headers=student_headers)
    assert leave_again.status_code == 404


@pytest.mark.asyncio
async def test_unauthorized_club_creation_rejected(client: AsyncClient, db_session) -> None:
    """14. Student / Faculty cannot create club (Admin only), returns 403."""
    _, student_headers = await create_test_user(
        db_session, "Student Unauthorized", "stu.unauthclub@university.edu", UserRole.STUDENT
    )
    res_stu = await client.post(
        "/api/v1/clubs",
        json={"name": "Secret Club", "category": "Social"},
        headers=student_headers,
    )
    assert res_stu.status_code == 403

    _, faculty_headers = await create_test_user(
        db_session, "Prof Unauthorized", "prof.unauthclub@university.edu", UserRole.FACULTY
    )
    res_fac = await client.post(
        "/api/v1/clubs",
        json={"name": "Faculty Club", "category": "Academic"},
        headers=faculty_headers,
    )
    assert res_fac.status_code == 403
