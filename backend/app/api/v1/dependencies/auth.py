"""
CampusOS — FastAPI Authentication & Authorization Dependencies
=============================================================
Reusable FastAPI dependencies for retrieving the authenticated user and enforcing RBAC.
"""
from __future__ import annotations

import uuid
from collections.abc import Callable
from typing import Any

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.errors import ForbiddenError, UnauthorizedError
from app.core.security import decode_access_token
from app.models.user import User, UserRole
from app.repositories.user_repository import user_repository

# OAuth2 scheme configured for OpenAPI docs
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=False,
)


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str | None = Depends(oauth2_scheme),
) -> User:
    """Extract and validate the current authenticated user from the Bearer JWT token.

    :raises UnauthorizedError: If token is missing, invalid, expired, or user not found.
    """
    if not token:
        raise UnauthorizedError("Authentication token is missing.")

    payload = decode_access_token(token)
    user_id_str = payload.get("sub")

    if not user_id_str:
        raise UnauthorizedError("Invalid token subject.")

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError as exc:
        raise UnauthorizedError("Invalid user ID in token.") from exc

    user = await user_repository.get_by_id(db, user_id)
    if not user:
        raise UnauthorizedError("User associated with token not found.")

    return user


async def require_authenticated_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Ensure the user is authenticated and active."""
    if not current_user.is_active:
        raise ForbiddenError("User account is inactive.")
    return current_user


def require_role(*allowed_roles: UserRole) -> Callable[..., Any]:
    """Dependency factory enforcing Role-Based Access Control (RBAC).

    Usage:
        @router.get("/admin-only", dependencies=[Depends(require_role(UserRole.ADMIN))])
        async def admin_endpoint(): ...

        @router.get("/staff-only", dependencies=[Depends(require_role(UserRole.ADMIN, UserRole.FACULTY))])
        async def staff_endpoint(): ...
    """

    async def role_checker(
        current_user: User = Depends(require_authenticated_user),
    ) -> User:
        if current_user.role not in allowed_roles:
            raise ForbiddenError(
                f"Action forbidden. Required role(s): {[r.value for r in allowed_roles]}. "
                f"Your role: {current_user.role.value}"
            )
        return current_user

    return role_checker
