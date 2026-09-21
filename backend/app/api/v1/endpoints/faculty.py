"""
CampusOS — Faculty Profile Endpoints
====================================
API routes for Faculty profile management and faculty directory.
"""
from __future__ import annotations

import uuid
from typing import Sequence

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies.auth import require_authenticated_user, require_role
from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.academic import (
    FacultyProfileCreate,
    FacultyProfileResponse,
    FacultyProfileUpdate,
)
from app.services.academic_service import academic_service

router = APIRouter(prefix="/faculty", tags=["Faculty"])


@router.get(
    "/me",
    response_model=FacultyProfileResponse,
    summary="Get current faculty profile",
    description="Fetch the faculty profile for the currently logged-in faculty user.",
)
async def get_my_faculty_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
) -> FacultyProfileResponse:
    """Get profile of currently logged-in faculty user."""
    return await academic_service.get_faculty_profile_by_user(db, current_user.id)


@router.put(
    "/me",
    response_model=FacultyProfileResponse,
    summary="Create or update current faculty profile",
    description="Initialize or update profile attributes for the logged in faculty member.",
)
async def update_my_faculty_profile(
    profile_in: FacultyProfileCreate | FacultyProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
) -> FacultyProfileResponse:
    """Create or update own faculty profile."""
    return await academic_service.create_or_update_faculty_profile(db, current_user.id, profile_in)


@router.get(
    "",
    response_model=list[FacultyProfileResponse],
    summary="List faculty profiles",
    description="Search and filter faculty directory.",
)
async def list_faculty(
    department_id: uuid.UUID | None = Query(None, description="Filter by department ID"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
) -> Sequence[FacultyProfileResponse]:
    """List faculty profiles."""
    return await academic_service.list_faculty(
        db, department_id=department_id, limit=limit, offset=offset
    )


@router.get(
    "/{profile_id}",
    response_model=FacultyProfileResponse,
    summary="Get faculty profile by ID",
    description="Fetch faculty profile by profile UUID.",
)
async def get_faculty_profile(
    profile_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
) -> FacultyProfileResponse:
    """Get faculty profile by ID."""
    return await academic_service.get_faculty_profile(db, profile_id)
