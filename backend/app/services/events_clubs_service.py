"""
CampusOS — Events & Clubs Service Layer (MVP)
=============================================
Business logic for managing events, event registrations, clubs, and club memberships.
"""
from __future__ import annotations

import uuid
from typing import Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, ForbiddenError, NotFoundError
from app.models.academic import StudentProfile
from app.models.events_clubs import Club, ClubMembership, Event, EventRegistration
from app.models.user import User, UserRole
from app.repositories.academic_repository import student_profile_repository
from app.repositories.events_clubs_repository import events_clubs_repository
from app.schemas.events_clubs import ClubCreate, EventCreate


class EventsClubsService:
    """Service handling business rules and orchestration for Events and Clubs."""

    async def _get_or_create_student_profile(
        self,
        db: AsyncSession,
        current_user: User,
    ) -> StudentProfile:
        """Resolve or automatically initialize student profile for student users."""
        if current_user.role != UserRole.STUDENT:
            raise ForbiddenError("Only students can perform this action.")

        profile = await student_profile_repository.get_by_user_id(db, current_user.id)
        if not profile:
            profile = StudentProfile(
                user_id=current_user.id,
                student_id=f"STU-{current_user.id.hex[:8].upper()}",
            )
            db.add(profile)
            await db.flush()
        return profile

    # -----------------------------------------------------------------------
    # Events Business Logic
    # -----------------------------------------------------------------------

    async def list_events(self, db: AsyncSession) -> Sequence[Event]:
        """List all events."""
        return await events_clubs_repository.list_events(db)

    async def get_event(self, db: AsyncSession, event_id: uuid.UUID) -> Event:
        """Get event details by ID."""
        event = await events_clubs_repository.get_event_by_id(db, event_id)
        if not event:
            raise NotFoundError("Event")
        return event

    async def create_event(
        self,
        db: AsyncSession,
        payload: EventCreate,
        current_user: User,
    ) -> Event:
        """Create a new event. Authorized: ADMIN and FACULTY."""
        if current_user.role not in (UserRole.ADMIN, UserRole.FACULTY):
            raise ForbiddenError("Only Admin or Faculty members can create events.")

        event = Event(
            title=payload.title.strip(),
            description=payload.description.strip() if payload.description else None,
            date_time=payload.date_time,
            location=payload.location.strip(),
            created_by=current_user.id,
        )
        return await events_clubs_repository.create_event(db, event)

    async def register_student_for_event(
        self,
        db: AsyncSession,
        event_id: uuid.UUID,
        current_user: User,
    ) -> EventRegistration:
        """Register student for an event. Prevents duplicate registrations."""
        event = await self.get_event(db, event_id)
        student_profile = await self._get_or_create_student_profile(db, current_user)

        existing = await events_clubs_repository.get_event_registration(
            db, event.id, student_profile.id
        )
        if existing:
            raise ConflictError("You are already registered for this event.")

        registration = EventRegistration(
            event_id=event.id,
            student_profile_id=student_profile.id,
        )
        return await events_clubs_repository.create_event_registration(db, registration)

    async def unregister_student_from_event(
        self,
        db: AsyncSession,
        event_id: uuid.UUID,
        current_user: User,
    ) -> None:
        """Unregister student from an event."""
        event = await self.get_event(db, event_id)

        if current_user.role != UserRole.STUDENT:
            raise ForbiddenError("Only students can unregister from events.")

        student_profile = await student_profile_repository.get_by_user_id(db, current_user.id)
        if not student_profile:
            raise NotFoundError("Event registration")

        existing = await events_clubs_repository.get_event_registration(
            db, event.id, student_profile.id
        )
        if not existing:
            raise NotFoundError("Event registration")

        await events_clubs_repository.delete_event_registration(db, existing)

    async def get_my_registrations(
        self,
        db: AsyncSession,
        current_user: User,
    ) -> Sequence[EventRegistration]:
        """Fetch all event registrations for the current student."""
        if current_user.role != UserRole.STUDENT:
            raise ForbiddenError("Only students have event registrations.")

        student_profile = await student_profile_repository.get_by_user_id(db, current_user.id)
        if not student_profile:
            return []

        return await events_clubs_repository.get_student_registrations(db, student_profile.id)

    # -----------------------------------------------------------------------
    # Clubs Business Logic
    # -----------------------------------------------------------------------

    async def list_clubs(self, db: AsyncSession) -> Sequence[Club]:
        """List all clubs."""
        return await events_clubs_repository.list_clubs(db)

    async def get_club(self, db: AsyncSession, club_id: uuid.UUID) -> Club:
        """Get club details by ID."""
        club = await events_clubs_repository.get_club_by_id(db, club_id)
        if not club:
            raise NotFoundError("Club")
        return club

    async def create_club(
        self,
        db: AsyncSession,
        payload: ClubCreate,
        current_user: User,
    ) -> Club:
        """Create a new club. Authorized: ADMIN only."""
        if current_user.role != UserRole.ADMIN:
            raise ForbiddenError("Only Administrators can create clubs.")

        existing = await events_clubs_repository.get_club_by_name(db, payload.name)
        if existing:
            raise ConflictError(f"Club with name '{payload.name.strip()}' already exists.")

        club = Club(
            name=payload.name.strip(),
            description=payload.description.strip() if payload.description else None,
            category=payload.category.strip(),
        )
        return await events_clubs_repository.create_club(db, club)

    async def join_club(
        self,
        db: AsyncSession,
        club_id: uuid.UUID,
        current_user: User,
    ) -> ClubMembership:
        """Join a club as student. Prevents duplicate memberships."""
        club = await self.get_club(db, club_id)
        student_profile = await self._get_or_create_student_profile(db, current_user)

        existing = await events_clubs_repository.get_club_membership(
            db, club.id, student_profile.id
        )
        if existing:
            raise ConflictError("You are already a member of this club.")

        membership = ClubMembership(
            club_id=club.id,
            student_profile_id=student_profile.id,
        )
        return await events_clubs_repository.create_club_membership(db, membership)

    async def leave_club(
        self,
        db: AsyncSession,
        club_id: uuid.UUID,
        current_user: User,
    ) -> None:
        """Leave a club."""
        club = await self.get_club(db, club_id)

        if current_user.role != UserRole.STUDENT:
            raise ForbiddenError("Only students can leave clubs.")

        student_profile = await student_profile_repository.get_by_user_id(db, current_user.id)
        if not student_profile:
            raise NotFoundError("Club membership")

        existing = await events_clubs_repository.get_club_membership(
            db, club.id, student_profile.id
        )
        if not existing:
            raise NotFoundError("Club membership")

        await events_clubs_repository.delete_club_membership(db, existing)


events_clubs_service = EventsClubsService()
