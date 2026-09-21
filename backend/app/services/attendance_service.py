"""
CampusOS — Attendance Service (MVP)
===================================
Business logic for Courses, Attendance Marking, and Student Attendance Aggregation.
"""
from __future__ import annotations

import logging
import uuid
from typing import Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, ForbiddenError, NotFoundError
from app.models.attendance import AttendanceRecord, AttendanceStatus, Course
from app.models.user import User, UserRole
from app.repositories.academic_repository import student_profile_repository
from app.repositories.attendance_repository import attendance_repository, course_repository
from app.schemas.attendance import (
    ATTENDANCE_THRESHOLD_PERCENT,
    AttendanceBatchCreate,
    AttendanceThresholdStatus,
    CourseCreate,
    StudentAttendanceOverviewResponse,
    StudentCourseAttendanceSummary,
)

logger = logging.getLogger(__name__)


class AttendanceService:
    """Service handling Course catalog and Attendance operations."""

    # -------------------------------------------------------------------------
    # Attendance Intelligence Calculations
    # -------------------------------------------------------------------------

    def evaluate_status(self, percentage: float) -> AttendanceThresholdStatus:
        """Determine if attendance percentage meets the 75% threshold."""
        if percentage >= ATTENDANCE_THRESHOLD_PERCENT:
            return AttendanceThresholdStatus.SATISFACTORY
        return AttendanceThresholdStatus.LOW_ATTENDANCE

    def calculate_classes_needed(self, attended: int, total: int) -> int:
        """Calculate minimum consecutive future classes needed to reach 75%.

        Formula:
            (A + X) / (T + X) >= 0.75 => X >= 3T - 4A
        """
        if total == 0:
            return 0
        pct = (attended / total) * 100.0
        if pct >= ATTENDANCE_THRESHOLD_PERCENT:
            return 0

        needed = (3 * total) - (4 * attended)
        return max(0, needed)

    # -------------------------------------------------------------------------
    # Course Management
    # -------------------------------------------------------------------------

    async def list_courses(self, db: AsyncSession) -> Sequence[Course]:
        """Fetch all courses."""
        return await course_repository.get_all(db)

    async def get_course(self, db: AsyncSession, course_id: uuid.UUID) -> Course:
        """Fetch course by ID or raise NotFoundError."""
        course = await course_repository.get_by_id(db, course_id)
        if not course:
            raise NotFoundError("Course")
        return course

    async def create_course(
        self,
        db: AsyncSession,
        data: CourseCreate,
        current_user: User,
    ) -> Course:
        """Create a course ensuring code uniqueness. Only Faculty or Admin allowed."""
        if current_user.role not in (UserRole.FACULTY, UserRole.ADMIN):
            raise ForbiddenError("Only Faculty or Admin can create courses.")

        existing = await course_repository.get_by_code(db, data.code)
        if existing:
            raise ConflictError(f"Course code '{data.code.upper()}' already exists.")

        course = await course_repository.create(
            db,
            code=data.code,
            name=data.name,
            department_id=data.department_id,
            faculty_id=data.faculty_id,
        )
        logger.info("Created course code=%s title=%s", course.code, course.name)
        return course

    # -------------------------------------------------------------------------
    # Attendance Marking Logic
    # -------------------------------------------------------------------------

    async def mark_batch_attendance(
        self,
        db: AsyncSession,
        data: AttendanceBatchCreate,
        current_user: User,
    ) -> list[AttendanceRecord]:
        """Batch mark student attendance for a course date. Only Faculty or Admin allowed."""
        if current_user.role not in (UserRole.FACULTY, UserRole.ADMIN):
            raise ForbiddenError("Only Faculty or Admin can mark attendance.")

        course = await self.get_course(db, data.course_id)

        saved_records = []
        for mark in data.records:
            # Verify student profile exists
            student_prof = await student_profile_repository.get_by_id(db, mark.student_profile_id)
            if not student_prof:
                raise NotFoundError(f"Student Profile '{mark.student_profile_id}'")

            record = await attendance_repository.upsert_record(
                db,
                course_id=course.id,
                student_profile_id=student_prof.id,
                attendance_date=data.date,
                status=mark.status,
                remarks=mark.remarks,
            )
            saved_records.append(record)

        logger.info(
            "Marked attendance course_id=%s date=%s count=%d by user=%s",
            course.id,
            data.date,
            len(saved_records),
            current_user.email,
        )
        return saved_records

    # -------------------------------------------------------------------------
    # Student Attendance Self-Service & Aggregation
    # -------------------------------------------------------------------------

    async def get_student_attendance_overview(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
    ) -> StudentAttendanceOverviewResponse:
        """Calculate and return attendance history and statistics for a student user.

        Formula:
            attendance_percentage = (attended_classes / total_classes) * 100
        """
        student_prof = await student_profile_repository.get_by_user_id(db, user_id)
        if not student_prof:
            # If no student profile created yet, return empty overview
            return StudentAttendanceOverviewResponse(
                total_classes=0,
                attended_classes=0,
                overall_percentage=100.0,
                status=AttendanceThresholdStatus.SATISFACTORY,
                classes_needed=0,
                course_summaries=[],
                recent_records=[],
            )

        records = await attendance_repository.get_student_records(db, student_prof.id)

        total_classes = len(records)
        attended_classes = sum(1 for r in records if r.status == AttendanceStatus.PRESENT)
        overall_percentage = (
            round((attended_classes / total_classes) * 100, 2) if total_classes > 0 else 100.0
        )
        overall_status = self.evaluate_status(overall_percentage)
        overall_classes_needed = self.calculate_classes_needed(attended_classes, total_classes)

        # Group stats by course
        course_groups: dict[uuid.UUID, dict] = {}
        for r in records:
            c_id = r.course_id
            if c_id not in course_groups:
                course_groups[c_id] = {
                    "course_id": c_id,
                    "course_code": r.course.code if r.course else "COURSE",
                    "course_name": r.course.name if r.course else "Course Name",
                    "total": 0,
                    "attended": 0,
                }
            course_groups[c_id]["total"] += 1
            if r.status == AttendanceStatus.PRESENT:
                course_groups[c_id]["attended"] += 1

        course_summaries = []
        for g in course_groups.values():
            tot = g["total"]
            att = g["attended"]
            pct = round((att / tot) * 100, 2) if tot > 0 else 100.0
            c_status = self.evaluate_status(pct)
            c_needed = self.calculate_classes_needed(att, tot)

            course_summaries.append(
                StudentCourseAttendanceSummary(
                    course_id=g["course_id"],
                    course_code=g["course_code"],
                    course_name=g["course_name"],
                    total_classes=tot,
                    attended_classes=att,
                    attendance_percentage=pct,
                    status=c_status,
                    classes_needed=c_needed,
                )
            )

        return StudentAttendanceOverviewResponse(
            total_classes=total_classes,
            attended_classes=attended_classes,
            overall_percentage=overall_percentage,
            status=overall_status,
            classes_needed=overall_classes_needed,
            course_summaries=course_summaries,
            recent_records=list(records),
        )

    async def get_course_attendance_sheet(
        self,
        db: AsyncSession,
        course_id: uuid.UUID,
        current_user: User,
        attendance_date: date | None = None,
    ) -> Sequence[AttendanceRecord]:
        """View course attendance register. Only Faculty or Admin allowed."""
        if current_user.role not in (UserRole.FACULTY, UserRole.ADMIN):
            raise ForbiddenError("Only Faculty or Admin can view course attendance sheet.")

        await self.get_course(db, course_id)
        return await attendance_repository.get_course_records(
            db, course_id, attendance_date=attendance_date
        )


attendance_service = AttendanceService()
