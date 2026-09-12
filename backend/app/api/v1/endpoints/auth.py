"""
CampusOS — Authentication API Endpoints
======================================
Public and protected authentication routes: register, login, refresh, logout, me.
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies.auth import (
    require_authenticated_user,
    require_role,
)
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.auth import (
    TokenRefreshRequest,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from app.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])

REFRESH_COOKIE_NAME = "refresh_token"


def _set_refresh_cookie(response: Response, raw_refresh_token: str) -> None:
    """Set HttpOnly cookie for raw refresh token."""
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=raw_refresh_token,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        path="/api/v1/auth",
    )


def _clear_refresh_cookie(response: Response) -> None:
    """Clear HttpOnly refresh token cookie."""
    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        path="/api/v1/auth",
    )


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Public endpoint to register a new user. Always assigns STUDENT role by default.",
)
async def register(
    payload: UserRegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Register a new user. Safely returns user profile without password credentials."""
    user = await auth_service.register(db, payload)
    return UserResponse.model_validate(user)


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate user and issue tokens",
    description="Authenticates email and password. Returns access token in body and sets HttpOnly cookie for refresh token.",
)
async def login(
    payload: UserLoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Authenticate user credentials and issue session tokens."""
    user = await auth_service.authenticate(db, payload.email, payload.password)
    user_agent = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None

    token_response, raw_refresh_token = await auth_service.create_tokens_for_user(
        db, user, user_agent=user_agent, ip_address=ip_address
    )
    _set_refresh_cookie(response, raw_refresh_token)
    return token_response


@router.post(
    "/refresh",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Refresh access token",
    description="Rotates refresh token and returns a new access token. Accepts token from HttpOnly cookie or request body.",
)
async def refresh(
    request: Request,
    response: Response,
    payload: TokenRefreshRequest | None = None,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """Refresh access token using token from HttpOnly cookie or request body."""
    raw_token = request.cookies.get(REFRESH_COOKIE_NAME)
    if not raw_token and payload:
        raw_token = payload.refresh_token

    user_agent = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None

    token_response, new_raw_refresh_token = await auth_service.refresh_tokens(
        db, raw_token or "", user_agent=user_agent, ip_address=ip_address
    )
    _set_refresh_cookie(response, new_raw_refresh_token)
    return token_response


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Logout user session",
    description="Revokes current refresh token session and clears HttpOnly refresh cookie.",
)
async def logout(
    request: Request,
    response: Response,
    payload: TokenRefreshRequest | None = None,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    """Logout session by revoking refresh token and clearing cookie."""
    raw_token = request.cookies.get(REFRESH_COOKIE_NAME)
    if not raw_token and payload:
        raw_token = payload.refresh_token

    await auth_service.logout(db, raw_token)
    _clear_refresh_cookie(response)
    return {"message": "Logged out successfully."}


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user profile",
    description="Returns the profile of the currently authenticated user.",
)
async def get_me(
    current_user: User = Depends(require_authenticated_user),
) -> UserResponse:
    """Return authenticated user profile."""
    return UserResponse.model_validate(current_user)


# =============================================================================
# Minimal Protected Test Endpoints for RBAC Verification
# =============================================================================


@router.get(
    "/test-student",
    status_code=status.HTTP_200_OK,
    summary="RBAC test endpoint for STUDENT role",
)
async def test_student_rbac(
    current_user: User = Depends(require_role(UserRole.STUDENT, UserRole.ADMIN)),
) -> dict[str, Any]:
    return {"message": f"Hello {current_user.full_name}, you have access to student area.", "role": current_user.role}


@router.get(
    "/test-faculty",
    status_code=status.HTTP_200_OK,
    summary="RBAC test endpoint for FACULTY role",
)
async def test_faculty_rbac(
    current_user: User = Depends(require_role(UserRole.FACULTY, UserRole.ADMIN)),
) -> dict[str, Any]:
    return {"message": f"Hello {current_user.full_name}, you have access to faculty area.", "role": current_user.role}


@router.get(
    "/test-admin",
    status_code=status.HTTP_200_OK,
    summary="RBAC test endpoint for ADMIN role",
)
async def test_admin_rbac(
    current_user: User = Depends(require_role(UserRole.ADMIN)),
) -> dict[str, Any]:
    return {"message": f"Hello {current_user.full_name}, you have access to admin area.", "role": current_user.role}
