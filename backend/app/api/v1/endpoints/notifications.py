"""
CampusOS — Notifications Endpoints (MVP)
========================================
REST API routes for user in-app notifications.
"""
from __future__ import annotations

import uuid
from typing import Sequence

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies.auth import require_authenticated_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.complaint_notification import NotificationResponse
from app.services.complaint_notification_service import (
    complaint_notification_service,
)

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get(
    "",
    response_model=list[NotificationResponse],
    status_code=status.HTTP_200_OK,
    summary="List own notifications",
    description="Retrieve all in-app notifications for the authenticated user.",
)
async def list_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
) -> Sequence[NotificationResponse]:
    """Retrieve notifications for the current user."""
    return await complaint_notification_service.list_my_notifications(
        db, current_user
    )


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
    status_code=status.HTTP_200_OK,
    summary="Mark notification as read",
    description="Mark a specific notification as read.",
)
async def mark_notification_as_read(
    notification_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
) -> NotificationResponse:
    """Mark a notification as read."""
    return await complaint_notification_service.mark_as_read(
        db, notification_id, current_user
    )
