"""
CampusOS — Academic & Profile Models
====================================
SQLAlchemy ORM models for Departments, Student Profiles, and Faculty Profiles.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class Department(Base):
    """Academic Department model (e.g. Computer Science, Electrical Engineering)."""

    __tablename__ = "departments"

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
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
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
    student_profiles: Mapped[list[StudentProfile]] = relationship(
        "StudentProfile",
        back_populates="department",
    )
    faculty_profiles: Mapped[list[FacultyProfile]] = relationship(
        "FacultyProfile",
        back_populates="department",
    )

    def __repr__(self) -> str:
        return f"<Department code={self.code} name={self.name}>"


class StudentProfile(Base):
    """Extended profile information for Student users."""

    __tablename__ = "student_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    student_id: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )
    department_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    program: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="B.Tech Computer Science",
    )
    batch_year: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=2026,
    )
    cgpa: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    phone_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    skills: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default="")
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
    user: Mapped[User] = relationship("User", back_populates="student_profile")
    department: Mapped[Optional[Department]] = relationship(
        "Department",
        back_populates="student_profiles",
    )

    def __repr__(self) -> str:
        return f"<StudentProfile student_id={self.student_id} user_id={self.user_id}>"


class FacultyProfile(Base):
    """Extended profile information for Faculty users."""

    __tablename__ = "faculty_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    employee_id: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )
    department_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    designation: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="Assistant Professor",
    )
    specialization: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    office_location: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    phone_number: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
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
    user: Mapped[User] = relationship("User", back_populates="faculty_profile")
    department: Mapped[Optional[Department]] = relationship(
        "Department",
        back_populates="faculty_profiles",
    )

    def __repr__(self) -> str:
        return f"<FacultyProfile employee_id={self.employee_id} user_id={self.user_id}>"
