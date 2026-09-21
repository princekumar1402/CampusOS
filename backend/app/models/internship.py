"""
CampusOS — Internship & Application Models
===========================================
SQLAlchemy ORM models for Internships and Student Applications.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    DateTime,
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
    from app.models.academic import StudentProfile
    from app.models.user import User


class Internship(Base):
    """Internship opportunity model."""

    __tablename__ = "internships"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    company: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    required_skills: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    mode: Mapped[str] = mapped_column(String(50), nullable=False, default="Remote")
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # Relationships
    creator: Mapped[User] = relationship("User")
    applications: Mapped[list[InternshipApplication]] = relationship(
        "InternshipApplication",
        back_populates="internship",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Internship title={self.title} company={self.company}>"


class InternshipApplication(Base):
    """Student application to an internship opportunity."""

    __tablename__ = "internship_applications"
    __table_args__ = (
        UniqueConstraint("internship_id", "student_profile_id", name="uq_internship_student_application"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    internship_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("internships.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    student_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="APPLIED",
    )
    applied_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # Relationships
    internship: Mapped[Internship] = relationship("Internship", back_populates="applications")
    student_profile: Mapped[StudentProfile] = relationship("StudentProfile")

    def __repr__(self) -> str:
        return f"<InternshipApplication internship_id={self.internship_id} student_profile_id={self.student_profile_id} status={self.status}>"
