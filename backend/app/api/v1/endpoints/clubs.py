"""
CampusOS — Clubs Endpoints (MVP)
===============================
REST API routes for Student Clubs and Club Memberships.
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
    ClubCreate,
    ClubMembershipResponse,
    ClubResponse,
)
from app.services.events_clubs_service import events_clubs_service

router = APIRouter(prefix="/clubs", tags=["Clubs"])


@router.get(
    "",
    response_model=list[ClubResponse],
    status_code=status.HTTP_200_OK,
    summary="List all student clubs",
)
async def list_clubs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
) -> Sequence[ClubResponse]:
    """Retrieve all student clubs."""
    return await events_clubs_service.list_clubs(db)


@router.post(
    "",
    response_model=ClubResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a student club",
    description="Authorized for Admin role only.",
)
async def create_club(
    payload: ClubCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
) -> ClubResponse:
    """Create a new club."""
    return await events_clubs_service.create_club(db, payload, current_user)


@router.get(
    "/{club_id}",
    response_model=ClubResponse,
    status_code=status.HTTP_200_OK,
    summary="Get club details",
)
async def get_club(
    club_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
) -> ClubResponse:
    """Retrieve single club details by ID."""
    return await events_clubs_service.get_club(db, club_id)


@router.post(
    "/{club_id}/join",
    response_model=ClubMembershipResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Join a club",
)
async def join_club(
    club_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
) -> ClubMembershipResponse:
    """Join a club as student."""
    return await events_clubs_service.join_club(db, club_id, current_user)


@router.delete(
    "/{club_id}/join",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Leave a club",
)
async def leave_club(
    club_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
) -> Response:
    """Leave a club."""
    await events_clubs_service.leave_club(db, club_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
