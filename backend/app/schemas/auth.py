"""
CampusOS — Authentication & User Schemas
========================================
Pydantic v2 schemas for authentication requests, responses, and user profiles.
"""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.user import UserRole

# =============================================================================
# Request Schemas
# =============================================================================


class UserRegisterRequest(BaseModel):
    """Public user registration request payload."""

    full_name: str = Field(..., min_length=2, max_length=255, description="User's full name")
    email: EmailStr = Field(..., description="Valid email address")
    password: str = Field(..., min_length=8, max_length=128, description="Plaintext password (min 8 chars)")


class UserLoginRequest(BaseModel):
    """User login request payload."""

    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., description="Plaintext password")


class TokenRefreshRequest(BaseModel):
    """Token refresh request payload (optional if refresh token is in cookie)."""

    refresh_token: str | None = Field(None, description="Raw refresh token string")


# =============================================================================
# Response Schemas
# =============================================================================


class UserResponse(BaseModel):
    """Safe user profile response — NEVER includes password or password_hash."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    full_name: str
    email: str
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login_at: datetime | None = None


class TokenResponse(BaseModel):
    """JWT Token response returned upon login or token refresh."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int = Field(..., description="Access token expiration time in seconds")
    user: UserResponse
