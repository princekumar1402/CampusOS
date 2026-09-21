"""
CampusOS — Attendance Endpoints (MVP)
=====================================
API routes for marking attendance, student self-service viewing, and course rosters.
"""
from __future__ import annotations

from datetime import date as date_type
import uuid
from typing import Sequence

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies.auth import require_authenticated_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.attendance import (
    AttendanceBatchCreate,
    AttendanceRecordResponse,
    StudentAttendanceOverviewResponse,
)
from app.services.attendance_service import attendance_service

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post(
    "/mark",
    response_model=list[AttendanceRecordResponse],
    status_code=status.HTTP_200_OK,
    summary="Batch mark attendance for a class session",
    description="Batch record PRESENT/ABSENT status for a course on a date. Requires Faculty or Admin role.",
)
async def mark_attendance(
    payload: AttendanceBatchCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
) -> Sequence[AttendanceRecordResponse]:
    """Mark attendance for students (Faculty / Admin only)."""
    return await attendance_service.mark_batch_attendance(db, payload, current_user)


@router.get(
    "/me",
    response_model=StudentAttendanceOverviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Get personal attendance summary & statistics",
    description="Retrieve personal attendance history, total classes, attended classes, and attendance percentage. Student self-service.",
)
async def get_my_attendance(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
) -> StudentAttendanceOverviewResponse:
    """Get own student attendance summary."""
    return await attendance_service.get_student_attendance_overview(db, current_user.id)


@router.get(
    "/course/{course_id}",
    response_model=list[AttendanceRecordResponse],
    status_code=status.HTTP_200_OK,
    summary="View course attendance register",
    description="View attendance records for a specific course with optional date filter. Requires Faculty or Admin role.",
)
async def get_course_attendance_sheet(
    course_id: uuid.UUID,
    date: date_type | None = Query(None, description="Optional attendance date filter (YYYY-MM-DD)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
) -> Sequence[AttendanceRecordResponse]:
    """View course attendance register (Faculty / Admin only)."""
    return await attendance_service.get_course_attendance_sheet(
        db, course_id, current_user, attendance_date=date
    )
