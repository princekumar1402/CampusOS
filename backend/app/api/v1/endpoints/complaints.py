"""
CampusOS — Complaints Endpoints (MVP)
====================================
REST API routes for CampusFix maintenance and service issue complaints.
"""
from __future__ import annotations

import uuid
from typing import Sequence

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies.auth import require_authenticated_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.complaint_notification import (
    ComplaintCreate,
    ComplaintResponse,
    ComplaintStatusUpdate,
)
from app.services.complaint_notification_service import (
    complaint_notification_service,
)

router = APIRouter(prefix="/complaints", tags=["CampusFix Complaints"])


@router.post(
    "",
    response_model=ComplaintResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a complaint",
    description="Authorized for Student role.",
)
async def create_complaint(
    payload: ComplaintCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
) -> ComplaintResponse:
    """Submit a new complaint."""
    return await complaint_notification_service.create_complaint(
        db, payload, current_user
    )


@router.get(
    "/me",
    response_model=list[ComplaintResponse],
    status_code=status.HTTP_200_OK,
    summary="View own complaints",
    description="Returns complaints submitted by the authenticated student.",
)
async def get_my_complaints(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
) -> Sequence[ComplaintResponse]:
    """Retrieve complaints submitted by the current student."""
    return await complaint_notification_service.get_my_complaints(db, current_user)


@router.get(
    "",
    response_model=list[ComplaintResponse],
    status_code=status.HTTP_200_OK,
    summary="List all complaints",
    description="Authorized for Admin role only.",
)
async def list_all_complaints(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
) -> Sequence[ComplaintResponse]:
    """Retrieve all complaints across campus (Admin only)."""
    return await complaint_notification_service.list_all_complaints(db, current_user)


@router.get(
    "/{complaint_id}",
    response_model=ComplaintResponse,
    status_code=status.HTTP_200_OK,
    summary="Get complaint details",
    description="Students may only view their own complaint. Admins may view any complaint.",
)
async def get_complaint(
    complaint_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
) -> ComplaintResponse:
    """Retrieve a single complaint by ID."""
    return await complaint_notification_service.get_complaint(
        db, complaint_id, current_user
    )


@router.patch(
    "/{complaint_id}/status",
    response_model=ComplaintResponse,
    status_code=status.HTTP_200_OK,
    summary="Update complaint status",
    description="Advance complaint status (OPEN -> IN_PROGRESS -> RESOLVED). Admin role only.",
)
async def update_complaint_status(
    complaint_id: uuid.UUID,
    payload: ComplaintStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
) -> ComplaintResponse:
    """Update complaint status."""
    return await complaint_notification_service.update_complaint_status(
        db, complaint_id, payload.status, current_user
    )
