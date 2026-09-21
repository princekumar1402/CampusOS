"""
CampusOS — Admin API Endpoints
=============================
Provides aggregate system statistics and admin overview metrics.
Strictly protected by Admin Role-Based Access Control (RBAC).
"""
from __future__ import annotations

import logging
from fastapi import APIRouter, Depends, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies.auth import require_role
from app.core.database import get_db
from app.models.academic import FacultyProfile, StudentProfile
from app.models.attendance import Course
from app.models.complaint_notification import Complaint, ComplaintStatus
from app.models.events_clubs import Club, Event
from app.models.internship import Internship, InternshipApplication
from app.models.user import User, UserRole
from app.schemas.admin import AdminStatsResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get(
    "/stats",
    response_model=AdminStatsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get System Overview Statistics",
    description="Returns aggregate counts across all CampusOS modules. Accessible only by ADMIN users.",
)
async def get_admin_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
) -> AdminStatsResponse:
    """Compute aggregate counts using existing database models."""
    logger.info("Admin %s fetching system statistics", current_user.id)

    student_users = await db.scalar(
        select(func.count(User.id)).where(User.role == UserRole.STUDENT)
    ) or 0
    student_profiles = await db.scalar(select(func.count(StudentProfile.id))) or 0
    students_count = max(student_users, student_profiles)

    faculty_users = await db.scalar(
        select(func.count(User.id)).where(User.role == UserRole.FACULTY)
    ) or 0
    faculty_profiles = await db.scalar(select(func.count(FacultyProfile.id))) or 0
    faculty_count = max(faculty_users, faculty_profiles)

    courses_count = await db.scalar(select(func.count(Course.id))) or 0
    events_count = await db.scalar(select(func.count(Event.id))) or 0
    clubs_count = await db.scalar(select(func.count(Club.id))) or 0
    complaints_count = await db.scalar(select(func.count(Complaint.id))) or 0
    open_complaints_count = await db.scalar(
        select(func.count(Complaint.id)).where(Complaint.status == ComplaintStatus.OPEN)
    ) or 0
    internships_count = await db.scalar(select(func.count(Internship.id))) or 0
    applications_count = await db.scalar(select(func.count(InternshipApplication.id))) or 0

    return AdminStatsResponse(
        students=students_count,
        faculty=faculty_count,
        courses=courses_count,
        events=events_count,
        clubs=clubs_count,
        complaints=complaints_count,
        open_complaints=open_complaints_count,
        internships=internships_count,
        applications=applications_count,
    )
