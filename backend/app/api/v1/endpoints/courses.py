"""
CampusOS — Course Endpoints
===========================
API routes for Course catalog management.
"""
from __future__ import annotations

import uuid
from typing import Sequence

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies.auth import require_authenticated_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.attendance import CourseCreate, CourseResponse
from app.services.attendance_service import attendance_service

router = APIRouter(prefix="/courses", tags=["Courses"])


@router.get(
    "",
    response_model=list[CourseResponse],
    summary="List all courses",
    description="Retrieve all active courses in the university catalog.",
)
async def list_courses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
) -> Sequence[CourseResponse]:
    """Get list of courses."""
    return await attendance_service.list_courses(db)


@router.post(
    "",
    response_model=CourseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new course",
    description="Create a course offering. Requires Faculty or Admin role.",
)
async def create_course(
    course_in: CourseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
) -> CourseResponse:
    """Create a course (Faculty / Admin)."""
    return await attendance_service.create_course(db, course_in, current_user)
