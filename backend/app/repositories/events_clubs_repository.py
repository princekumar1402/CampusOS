"""
CampusOS — Events & Clubs Repository Layer (MVP)
================================================
Database operations for Events, Event Registrations, Clubs, and Club Memberships.
"""
from __future__ import annotations

import uuid
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.events_clubs import Club, ClubMembership, Event, EventRegistration


class EventsClubsRepository:
    """Async database operations for Events and Clubs."""

    # -----------------------------------------------------------------------
    # Events Operations
    # -----------------------------------------------------------------------

    async def list_events(self, db: AsyncSession) -> Sequence[Event]:
        """Fetch all events ordered by date_time ascending."""
        stmt = select(Event).order_by(Event.date_time.asc())
        result = await db.execute(stmt)
        return result.scalars().all()

    async def get_event_by_id(self, db: AsyncSession, event_id: uuid.UUID) -> Event | None:
        """Fetch a single event by primary key."""
        stmt = select(Event).where(Event.id == event_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_event(self, db: AsyncSession, event: Event) -> Event:
        """Persist a new event."""
        db.add(event)
        await db.flush()
        return event

    async def get_event_registration(
        self,
        db: AsyncSession,
        event_id: uuid.UUID,
        student_profile_id: uuid.UUID,
    ) -> EventRegistration | None:
        """Fetch an existing event registration by event and student profile."""
        stmt = select(EventRegistration).where(
            EventRegistration.event_id == event_id,
            EventRegistration.student_profile_id == student_profile_id,
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_event_registration(
        self,
        db: AsyncSession,
        registration: EventRegistration,
    ) -> EventRegistration:
        """Persist a new event registration."""
        db.add(registration)
        await db.flush()
        return registration

    async def delete_event_registration(
        self,
        db: AsyncSession,
        registration: EventRegistration,
    ) -> None:
        """Delete an event registration."""
        await db.delete(registration)
        await db.flush()

    async def get_student_registrations(
        self,
        db: AsyncSession,
        student_profile_id: uuid.UUID,
    ) -> Sequence[EventRegistration]:
        """Fetch all registrations for a student profile."""
        stmt = (
            select(EventRegistration)
            .where(EventRegistration.student_profile_id == student_profile_id)
            .order_by(EventRegistration.registered_at.desc())
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    # -----------------------------------------------------------------------
    # Clubs Operations
    # -----------------------------------------------------------------------

    async def list_clubs(self, db: AsyncSession) -> Sequence[Club]:
        """Fetch all clubs ordered by name ascending."""
        stmt = select(Club).order_by(Club.name.asc())
        result = await db.execute(stmt)
        return result.scalars().all()

    async def get_club_by_id(self, db: AsyncSession, club_id: uuid.UUID) -> Club | None:
        """Fetch a single club by primary key."""
        stmt = select(Club).where(Club.id == club_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_club_by_name(self, db: AsyncSession, name: str) -> Club | None:
        """Fetch a club by unique name."""
        stmt = select(Club).where(Club.name == name.strip())
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_club(self, db: AsyncSession, club: Club) -> Club:
        """Persist a new club."""
        db.add(club)
        await db.flush()
        return club

    async def get_club_membership(
        self,
        db: AsyncSession,
        club_id: uuid.UUID,
        student_profile_id: uuid.UUID,
    ) -> ClubMembership | None:
        """Fetch an existing club membership by club and student profile."""
        stmt = select(ClubMembership).where(
            ClubMembership.club_id == club_id,
            ClubMembership.student_profile_id == student_profile_id,
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_club_membership(
        self,
        db: AsyncSession,
        membership: ClubMembership,
    ) -> ClubMembership:
        """Persist a new club membership."""
        db.add(membership)
        await db.flush()
        return membership

    async def delete_club_membership(
        self,
        db: AsyncSession,
        membership: ClubMembership,
    ) -> None:
        """Delete a club membership."""
        await db.delete(membership)
        await db.flush()

    async def get_student_memberships(
        self,
        db: AsyncSession,
        student_profile_id: uuid.UUID,
    ) -> Sequence[ClubMembership]:
        """Fetch all club memberships for a student profile."""
        stmt = (
            select(ClubMembership)
            .where(ClubMembership.student_profile_id == student_profile_id)
            .order_by(ClubMembership.joined_at.desc())
        )
        result = await db.execute(stmt)
        return result.scalars().all()


events_clubs_repository = EventsClubsRepository()
