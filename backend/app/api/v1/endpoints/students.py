"""
CampusOS — Student Profile Endpoints
====================================
API routes for Student profile management and student directory.
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
    StudentProfileCreate,
    StudentProfileResponse,
    StudentProfileUpdate,
)
from app.services.academic_service import academic_service

router = APIRouter(prefix="/students", tags=["Students"])


@router.get(
    "/me",
    response_model=StudentProfileResponse,
    summary="Get current student profile",
    description="Fetch the student profile for the currently logged-in student user.",
)
async def get_my_student_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
) -> StudentProfileResponse:
    """Get profile of currently logged-in user."""
    return await academic_service.get_student_profile_by_user(db, current_user.id)


@router.put(
    "/me",
    response_model=StudentProfileResponse,
    summary="Create or update current student profile",
    description="Initialize or update profile attributes for the logged in student.",
)
async def update_my_student_profile(
    profile_in: StudentProfileCreate | StudentProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
) -> StudentProfileResponse:
    """Create or update own student profile."""
    return await academic_service.create_or_update_student_profile(db, current_user.id, profile_in)


@router.get(
    "",
    response_model=list[StudentProfileResponse],
    summary="List student profiles",
    description="Search and filter student profiles in the student directory. Accessible by Faculty and Admin.",
)
async def list_students(
    department_id: uuid.UUID | None = Query(None, description="Filter by department ID"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
) -> Sequence[StudentProfileResponse]:
    """List students (Faculty/Admin/Students)."""
    return await academic_service.list_students(
        db, department_id=department_id, limit=limit, offset=offset
    )


@router.get(
    "/{profile_id}",
    response_model=StudentProfileResponse,
    summary="Get student profile by ID",
    description="Fetch student profile by profile UUID.",
)
async def get_student_profile(
    profile_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
) -> StudentProfileResponse:
    """Get student profile by ID."""
    return await academic_service.get_student_profile(db, profile_id)
