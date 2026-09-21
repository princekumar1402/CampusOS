"""
CampusOS — Attendance & Course Models (MVP)
===========================================
SQLAlchemy ORM models for Courses and Attendance Records.
"""
from __future__ import annotations

import enum
import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    Date,
    Enum,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.academic import Department, FacultyProfile, StudentProfile


class AttendanceStatus(str, enum.Enum):
    """Attendance status enumeration for Stage 1 MVP."""

    PRESENT = "PRESENT"
    ABSENT = "ABSENT"


class Course(Base):
    """Minimal Course catalog model."""

    __tablename__ = "courses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    code: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        index=True,
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    department_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    faculty_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("faculty_profiles.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        nullable=False,
        server_default=func.now(),
        onupdate=func.now,
    )

    # Relationships
    department: Mapped[Optional[Department]] = relationship("Department")
    faculty: Mapped[Optional[FacultyProfile]] = relationship("FacultyProfile")
    attendance_records: Mapped[list[AttendanceRecord]] = relationship(
        "AttendanceRecord",
        back_populates="course",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Course code={self.code} name={self.name}>"


class AttendanceRecord(Base):
    """Attendance log entry for a student in a course on a specific date."""

    __tablename__ = "attendance_records"
    __table_args__ = (
        UniqueConstraint(
            "course_id",
            "student_profile_id",
            "date",
            name="uq_course_student_date",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    course_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    student_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )
    status: Mapped[AttendanceStatus] = mapped_column(
        Enum(AttendanceStatus, name="attendance_status_enum"),
        nullable=False,
        default=AttendanceStatus.PRESENT,
    )
    remarks: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        nullable=False,
        server_default=func.now(),
        onupdate=func.now,
    )

    # Relationships
    course: Mapped[Course] = relationship("Course", back_populates="attendance_records")
    student_profile: Mapped[StudentProfile] = relationship("StudentProfile")

    def __repr__(self) -> str:
        return f"<AttendanceRecord course_id={self.course_id} student_id={self.student_profile_id} date={self.date} status={self.status}>"
