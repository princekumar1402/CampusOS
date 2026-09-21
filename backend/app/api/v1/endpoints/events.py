"""
CampusOS — Events Endpoints (MVP)
=================================
REST API routes for Campus Events and Event Registrations.
"""
from __future__ import annotations

import uuid
from typing import Sequence

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies.auth import require_authenticated_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.events_clubs import (
    EventCreate,
    EventRegistrationResponse,
    EventResponse,
)
from app.services.events_clubs_service import events_clubs_service

router = APIRouter(prefix="/events", tags=["Events"])


@router.get(
    "",
    response_model=list[EventResponse],
    status_code=status.HTTP_200_OK,
    summary="List all campus events",
)
async def list_events(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
) -> Sequence[EventResponse]:
    """Retrieve all upcoming campus events."""
    return await events_clubs_service.list_events(db)


@router.post(
    "",
    response_model=EventResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a campus event",
    description="Authorized for Admin and Faculty roles.",
)
async def create_event(
    payload: EventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
) -> EventResponse:
    """Create a new event."""
    return await events_clubs_service.create_event(db, payload, current_user)


@router.get(
    "/my-registrations",
    response_model=list[EventRegistrationResponse],
    status_code=status.HTTP_200_OK,
    summary="Get current student event registrations",
)
async def get_my_registrations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
) -> Sequence[EventRegistrationResponse]:
    """Fetch events registered by the current student."""
    return await events_clubs_service.get_my_registrations(db, current_user)


@router.get(
    "/{event_id}",
    response_model=EventResponse,
    status_code=status.HTTP_200_OK,
    summary="Get event details",
)
async def get_event(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
) -> EventResponse:
    """Retrieve single event details by ID."""
    return await events_clubs_service.get_event(db, event_id)


@router.post(
    "/{event_id}/register",
    response_model=EventRegistrationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register for an event",
)
async def register_for_event(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
) -> EventRegistrationResponse:
    """Register current student for an event."""
    return await events_clubs_service.register_student_for_event(db, event_id, current_user)


@router.delete(
    "/{event_id}/register",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Unregister from an event",
)
async def unregister_from_event(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
) -> Response:
    """Cancel registration for an event."""
    await events_clubs_service.unregister_student_from_event(db, event_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
