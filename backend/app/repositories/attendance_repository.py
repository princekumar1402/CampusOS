"""
CampusOS — Course & Attendance Repositories
============================================
Database operations for Course and AttendanceRecord entities.
"""
from __future__ import annotations

import uuid
from datetime import UTC, date, datetime
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.attendance import AttendanceRecord, AttendanceStatus, Course



class CourseRepository:
    """Repository handling database operations for Course records."""

    async def get_by_id(self, db: AsyncSession, course_id: uuid.UUID) -> Course | None:
        """Fetch course by ID with department and faculty loaded."""
        stmt = (
            select(Course)
            .options(
                selectinload(Course.department),
                selectinload(Course.faculty),
            )
            .where(Course.id == course_id)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_code(self, db: AsyncSession, code: str) -> Course | None:
        """Fetch course by code (e.g. 'CS101')."""
        normalized_code = code.strip().upper()
        stmt = select(Course).where(Course.code == normalized_code)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all(self, db: AsyncSession) -> Sequence[Course]:
        """Fetch all active courses ordered by code."""
        stmt = (
            select(Course)
            .options(
                selectinload(Course.department),
                selectinload(Course.faculty),
            )
            .order_by(Course.code)
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    async def create(
        self,
        db: AsyncSession,
        *,
        code: str,
        name: str,
        department_id: uuid.UUID | None = None,
        faculty_id: uuid.UUID | None = None,
    ) -> Course:
        """Create a new course."""
        course = Course(
            code=code.strip().upper(),
            name=name.strip(),
            department_id=department_id,
            faculty_id=faculty_id,
        )
        db.add(course)
        await db.flush()
        return await self.get_by_id(db, course.id)  # type: ignore[return-value]


class AttendanceRepository:
    """Repository handling database operations for Attendance records."""

    async def upsert_record(
        self,
        db: AsyncSession,
        *,
        course_id: uuid.UUID,
        student_profile_id: uuid.UUID,
        attendance_date: date,
        status: AttendanceStatus,
        remarks: str | None = None,
    ) -> AttendanceRecord:
        """Create or update attendance record for (course_id, student_profile_id, date)."""
        stmt = select(AttendanceRecord).where(
            AttendanceRecord.course_id == course_id,
            AttendanceRecord.student_profile_id == student_profile_id,
            AttendanceRecord.date == attendance_date,
        )
        result = await db.execute(stmt)
        record = result.scalar_one_or_none()

        if record is None:
            record = AttendanceRecord(
                course_id=course_id,
                student_profile_id=student_profile_id,
                date=attendance_date,
                status=status,
                remarks=remarks.strip() if remarks else None,
            )
            db.add(record)
        else:
            record.status = status
            record.updated_at = datetime.now(UTC).replace(tzinfo=None)
            if remarks is not None:
                record.remarks = remarks.strip() if remarks else None


        await db.flush()
        # Reload with relationships loaded for serialization
        stmt = (
            select(AttendanceRecord)
            .options(selectinload(AttendanceRecord.course))
            .where(AttendanceRecord.id == record.id)
        )
        res = await db.execute(stmt)
        return res.scalar_one()


    async def get_student_records(
        self,
        db: AsyncSession,
        student_profile_id: uuid.UUID,
    ) -> Sequence[AttendanceRecord]:
        """Fetch all attendance records for a student ordered by date descending."""
        stmt = (
            select(AttendanceRecord)
            .options(
                selectinload(AttendanceRecord.course).selectinload(Course.department),
            )
            .where(AttendanceRecord.student_profile_id == student_profile_id)
            .order_by(AttendanceRecord.date.desc(), AttendanceRecord.created_at.desc())
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    async def get_course_records(
        self,
        db: AsyncSession,
        course_id: uuid.UUID,
        attendance_date: date | None = None,
    ) -> Sequence[AttendanceRecord]:
        """Fetch attendance records for a course with optional date filter."""
        stmt = (
            select(AttendanceRecord)
            .options(
                selectinload(AttendanceRecord.course),
                selectinload(AttendanceRecord.student_profile).selectinload(
                    AttendanceRecord.student_profile.property.mapper.class_.user
                ),
            )
            .where(AttendanceRecord.course_id == course_id)
        )
        if attendance_date:
            stmt = stmt.where(AttendanceRecord.date == attendance_date)
        stmt = stmt.order_by(AttendanceRecord.date.desc())
        result = await db.execute(stmt)
        return result.scalars().all()


course_repository = CourseRepository()
attendance_repository = AttendanceRepository()
