"""
CampusOS — Authentication & RBAC Comprehensive Test Suite
==========================================================
Tests for user registration, login, token refresh, logout, /auth/me, security assertions, and RBAC.
"""
from __future__ import annotations

from datetime import timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import UserRole
from app.repositories.user_repository import user_repository


@pytest.mark.asyncio
class TestRegistration:
    """Test suite for POST /api/v1/auth/register."""

    async def test_register_success(self, client: AsyncClient):
        """Valid registration creates a user with default STUDENT role."""
        payload = {
            "full_name": "John Student",
            "email": "john.student@university.edu",
            "password": "SecurePassword123!",
        }
        response = await client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 201

        data = response.json()
        assert data["full_name"] == "John Student"
        assert data["email"] == "john.student@university.edu"
        assert data["role"] == "STUDENT"
        assert data["is_active"] is True
        assert data["is_verified"] is False
        assert "id" in data
        assert "created_at" in data

        # Security check: password_hash must NEVER be exposed
        assert "password_hash" not in data
        assert "password" not in data

    async def test_register_normalizes_email(self, client: AsyncClient):
        """Registration should trim and lowercase email addresses."""
        payload = {
            "full_name": "Jane Student",
            "email": "  JANE.STUDENT@University.EDU  ",
            "password": "SecurePassword123!",
        }
        response = await client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 201
        assert response.json()["email"] == "jane.student@university.edu"

    async def test_register_duplicate_email(self, client: AsyncClient):
        """Duplicate email registration must fail with HTTP 409 Conflict."""
        payload = {
            "full_name": "User One",
            "email": "duplicate@university.edu",
            "password": "SecurePassword123!",
        }
        res1 = await client.post("/api/v1/auth/register", json=payload)
        assert res1.status_code == 201

        res2 = await client.post("/api/v1/auth/register", json=payload)
        assert res2.status_code == 409
        assert res2.json()["error"] == "ConflictError"

    async def test_register_invalid_email(self, client: AsyncClient):
        """Invalid email address format must be rejected."""
        payload = {
            "full_name": "Invalid Email",
            "email": "not-an-email",
            "password": "SecurePassword123!",
        }
        response = await client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 422

    async def test_register_weak_password(self, client: AsyncClient):
        """Passwords shorter than 8 characters must be rejected."""
        payload = {
            "full_name": "Weak Pass",
            "email": "weak@university.edu",
            "password": "short",
        }
        response = await client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 422

    async def test_register_always_creates_student_role(self, client: AsyncClient):
        """Public registration payload cannot self-assign ADMIN role."""
        payload = {
            "full_name": "Attacker",
            "email": "attacker@university.edu",
            "password": "SecurePassword123!",
            "role": "ADMIN",  # Ignored by schema or overridden
        }
        response = await client.post("/api/v1/auth/register", json=payload)
        assert response.status_code == 201
        assert response.json()["role"] == "STUDENT"


@pytest.mark.asyncio
class TestLogin:
    """Test suite for POST /api/v1/auth/login."""

    async def test_login_success(self, client: AsyncClient):
        """Successful login returns access token and sets refresh cookie."""
        # 1. Register user
        reg_payload = {
            "full_name": "Alice Smith",
            "email": "alice@university.edu",
            "password": "Password123!",
        }
        await client.post("/api/v1/auth/register", json=reg_payload)

        # 2. Login
        login_payload = {
            "email": "alice@university.edu",
            "password": "Password123!",
        }
        response = await client.post("/api/v1/auth/login", json=login_payload)
        assert response.status_code == 200

        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "alice@university.edu"
        assert "password_hash" not in data["user"]

        # Check HttpOnly cookie set
        cookies = response.cookies
        assert "refresh_token" in cookies

    async def test_login_incorrect_password(self, client: AsyncClient):
        """Incorrect password returns HTTP 401 Unauthorized."""
        reg_payload = {
            "full_name": "Bob Jones",
            "email": "bob@university.edu",
            "password": "CorrectPassword123!",
        }
        await client.post("/api/v1/auth/register", json=reg_payload)

        login_payload = {
            "email": "bob@university.edu",
            "password": "WrongPassword123!",
        }
        response = await client.post("/api/v1/auth/login", json=login_payload)
        assert response.status_code == 401
        assert response.json()["error"] == "UnauthorizedError"

    async def test_login_nonexistent_email(self, client: AsyncClient):
        """Non-existent email returns generic 401 Unauthorized message."""
        login_payload = {
            "email": "nobody@university.edu",
            "password": "Password123!",
        }
        response = await client.post("/api/v1/auth/login", json=login_payload)
        assert response.status_code == 401
        assert response.json()["message"] == "Invalid email or password."

    async def test_login_inactive_user(self, client: AsyncClient, db_session: AsyncSession):
        """Inactive user account login must be blocked."""
        # Create inactive user directly in DB
        hashed = hash_password("Password123!")
        await user_repository.create(
            db_session,
            full_name="Inactive User",
            email="inactive@university.edu",
            password_hash=hashed,
            is_active=False,
        )
        await db_session.commit()

        login_payload = {
            "email": "inactive@university.edu",
            "password": "Password123!",
        }
        response = await client.post("/api/v1/auth/login", json=login_payload)
        assert response.status_code == 401
        assert "inactive" in response.json()["message"].lower()


@pytest.mark.asyncio
class TestCurrentUser:
    """Test suite for GET /api/v1/auth/me."""

    async def test_get_me_success(self, client: AsyncClient):
        """Authenticated request returns current user profile."""
        reg_payload = {
            "full_name": "Carol Danvers",
            "email": "carol@university.edu",
            "password": "Password123!",
        }
        await client.post("/api/v1/auth/register", json=reg_payload)

        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email": "carol@university.edu", "password": "Password123!"},
        )
        token = login_res.json()["access_token"]

        headers = {"Authorization": f"Bearer {token}"}
        me_res = await client.get("/api/v1/auth/me", headers=headers)
        assert me_res.status_code == 200

        data = me_res.json()
        assert data["email"] == "carol@university.edu"
        assert data["full_name"] == "Carol Danvers"
        assert "password_hash" not in data

    async def test_get_me_unauthenticated(self, client: AsyncClient):
        """Missing authorization header returns 401."""
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 401

    async def test_get_me_expired_token(self, client: AsyncClient, db_session: AsyncSession):
        """Expired access token returns HTTP 401."""
        hashed = hash_password("Password123!")
        user = await user_repository.create(
            db_session,
            full_name="Expired User",
            email="expired@university.edu",
            password_hash=hashed,
        )
        await db_session.commit()

        # Create expired token (-10 minutes)
        expired_token = create_access_token(
            subject=str(user.id),
            role=user.role.value,
            expires_delta=timedelta(minutes=-10),
        )

        headers = {"Authorization": f"Bearer {expired_token}"}
        response = await client.get("/api/v1/auth/me", headers=headers)
        assert response.status_code == 401
        assert "expired" in response.json()["message"].lower()


@pytest.mark.asyncio
class TestTokenRefreshAndLogout:
    """Test suite for POST /api/v1/auth/refresh and POST /api/v1/auth/logout."""

    async def test_refresh_token_rotation(self, client: AsyncClient):
        """Refreshing access token rotates the refresh token."""
        # 1. Register & login
        await client.post(
            "/api/v1/auth/register",
            json={"full_name": "Dave", "email": "dave@university.edu", "password": "Password123!"},
        )
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email": "dave@university.edu", "password": "Password123!"},
        )
        old_refresh_cookie = login_res.cookies.get("refresh_token")

        # 2. Call refresh
        refresh_res = await client.post(
            "/api/v1/auth/refresh",
            cookies={"refresh_token": old_refresh_cookie},
        )
        assert refresh_res.status_code == 200
        new_token_data = refresh_res.json()
        assert "access_token" in new_token_data

        new_refresh_cookie = refresh_res.cookies.get("refresh_token")
        assert new_refresh_cookie != old_refresh_cookie

        # 3. ROTATION VERIFICATION: Attempting to reuse old refresh cookie must be rejected (401)
        reuse_res = await client.post(
            "/api/v1/auth/refresh",
            cookies={"refresh_token": old_refresh_cookie},
        )
        assert reuse_res.status_code == 401

    async def test_logout_revokes_token(self, client: AsyncClient):
        """Logout invalidates refresh token session."""
        await client.post(
            "/api/v1/auth/register",
            json={"full_name": "Eve", "email": "eve@university.edu", "password": "Password123!"},
        )
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email": "eve@university.edu", "password": "Password123!"},
        )
        refresh_cookie = login_res.cookies.get("refresh_token")

        # Call logout
        logout_res = await client.post(
            "/api/v1/auth/logout",
            cookies={"refresh_token": refresh_cookie},
        )
        assert logout_res.status_code == 200
        assert logout_res.json()["message"] == "Logged out successfully."

        # Attempt to refresh after logout must fail
        refresh_res = await client.post(
            "/api/v1/auth/refresh",
            cookies={"refresh_token": refresh_cookie},
        )
        assert refresh_res.status_code == 401


@pytest.mark.asyncio
class TestRoleBasedAccessControl:
    """Test suite for RBAC endpoints."""

    async def test_student_role_access(self, client: AsyncClient, db_session: AsyncSession):
        """STUDENT user can access student test endpoint but not admin endpoint."""
        hashed = hash_password("Password123!")
        student = await user_repository.create(
            db_session,
            full_name="Student User",
            email="student.test@university.edu",
            password_hash=hashed,
            role=UserRole.STUDENT,
        )
        await db_session.commit()

        token = create_access_token(subject=str(student.id), role=student.role.value)
        headers = {"Authorization": f"Bearer {token}"}

        # Student endpoint -> 200 OK
        student_res = await client.get("/api/v1/auth/test-student", headers=headers)
        assert student_res.status_code == 200

        # Admin endpoint -> 403 Forbidden
        admin_res = await client.get("/api/v1/auth/test-admin", headers=headers)
        assert admin_res.status_code == 403
        assert admin_res.json()["error"] == "ForbiddenError"

    async def test_admin_role_access(self, client: AsyncClient, db_session: AsyncSession):
        """ADMIN user can access admin and student test endpoints."""
        hashed = hash_password("Password123!")
        admin = await user_repository.create(
            db_session,
            full_name="Admin User",
            email="admin.test@university.edu",
            password_hash=hashed,
            role=UserRole.ADMIN,
        )
        await db_session.commit()

        token = create_access_token(subject=str(admin.id), role=admin.role.value)
        headers = {"Authorization": f"Bearer {token}"}

        admin_res = await client.get("/api/v1/auth/test-admin", headers=headers)
        assert admin_res.status_code == 200

        student_res = await client.get("/api/v1/auth/test-student", headers=headers)
        assert student_res.status_code == 200


@pytest.mark.asyncio
class TestSecurityAssertions:
    """Explicit security verification tests."""

    async def test_password_hashing_security(self, db_session: AsyncSession):
        """Passwords must be hashed using Argon2id and never stored in plaintext."""
        raw_pass = "MySecretPassword123!"
        hashed = hash_password(raw_pass)

        assert hashed != raw_pass
        assert "$argon2id$" in hashed
        assert verify_password(raw_pass, hashed) is True
        assert verify_password("WrongPass123!", hashed) is False
