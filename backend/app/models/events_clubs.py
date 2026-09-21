"""
CampusOS — Events & Clubs Models (MVP)
=====================================
SQLAlchemy ORM models for Campus Events, Event Registrations,
Student Clubs, and Club Memberships.
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


class Event(Base):
    """Campus Event model."""

    __tablename__ = "events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    date_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # Relationships
    creator: Mapped[User] = relationship("User")
    registrations: Mapped[list[EventRegistration]] = relationship(
        "EventRegistration",
        back_populates="event",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Event id={self.id} title={self.title}>"


class EventRegistration(Base):
    """Event Registration link table for student attendees."""

    __tablename__ = "event_registrations"
    __table_args__ = (
        UniqueConstraint("event_id", "student_profile_id", name="uq_event_student"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
    )
    student_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    registered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # Relationships
    event: Mapped[Event] = relationship("Event", back_populates="registrations")
    student_profile: Mapped[StudentProfile] = relationship("StudentProfile")

    def __repr__(self) -> str:
        return f"<EventRegistration event_id={self.event_id} student_profile_id={self.student_profile_id}>"


class Club(Base):
    """Student Club or Organization model."""

    __tablename__ = "clubs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # Relationships
    memberships: Mapped[list[ClubMembership]] = relationship(
        "ClubMembership",
        back_populates="club",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Club id={self.id} name={self.name}>"


class ClubMembership(Base):
    """Club Membership link table for student members."""

    __tablename__ = "club_memberships"
    __table_args__ = (
        UniqueConstraint("club_id", "student_profile_id", name="uq_club_student"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    club_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clubs.id", ondelete="CASCADE"),
        nullable=False,
    )
    student_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("student_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # Relationships
    club: Mapped[Club] = relationship("Club", back_populates="memberships")
    student_profile: Mapped[StudentProfile] = relationship("StudentProfile")

    def __repr__(self) -> str:
        return f"<ClubMembership club_id={self.club_id} student_profile_id={self.student_profile_id}>"
