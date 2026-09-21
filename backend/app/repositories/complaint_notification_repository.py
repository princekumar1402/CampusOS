"""
CampusOS — Complaints & Notifications Repository Layer (MVP)
============================================================
Database operations for Complaints and Notifications.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.complaint_notification import (
    Complaint,
    ComplaintStatus,
    Notification,
)


class ComplaintNotificationRepository:
    """Async database operations for Complaints and Notifications."""

    # -----------------------------------------------------------------------
    # Complaints Operations
    # -----------------------------------------------------------------------

    async def create_complaint(self, db: AsyncSession, complaint: Complaint) -> Complaint:
        """Persist a new complaint."""
        db.add(complaint)
        await db.flush()
        return complaint

    async def get_complaint_by_id(
        self,
        db: AsyncSession,
        complaint_id: uuid.UUID,
    ) -> Complaint | None:
        """Fetch a single complaint by primary key."""
        stmt = select(Complaint).where(Complaint.id == complaint_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_complaints(self, db: AsyncSession) -> Sequence[Complaint]:
        """Fetch all complaints ordered by creation date descending."""
        stmt = select(Complaint).order_by(Complaint.created_at.desc())
        result = await db.execute(stmt)
        return result.scalars().all()

    async def list_complaints_by_user(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
    ) -> Sequence[Complaint]:
        """Fetch all complaints created by a specific user."""
        stmt = (
            select(Complaint)
            .where(Complaint.created_by == user_id)
            .order_by(Complaint.created_at.desc())
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    async def update_complaint_status(
        self,
        db: AsyncSession,
        complaint: Complaint,
        new_status: ComplaintStatus,
    ) -> Complaint:
        """Update the status of an existing complaint."""
        complaint.status = new_status
        complaint.updated_at = datetime.now(timezone.utc)
        await db.flush()
        return complaint

    # -----------------------------------------------------------------------
    # Notifications Operations
    # -----------------------------------------------------------------------

    async def create_notification(
        self,
        db: AsyncSession,
        notification: Notification,
    ) -> Notification:
        """Persist a new notification."""
        db.add(notification)
        await db.flush()
        return notification

    async def list_notifications_by_user(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
    ) -> Sequence[Notification]:
        """Fetch all notifications for a user ordered by newest first."""
        stmt = (
            select(Notification)
            .where(Notification.user_id == user_id)
            .order_by(Notification.created_at.desc())
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    async def get_notification_by_id(
        self,
        db: AsyncSession,
        notification_id: uuid.UUID,
    ) -> Notification | None:
        """Fetch a notification by ID."""
        stmt = select(Notification).where(Notification.id == notification_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def mark_notification_as_read(
        self,
        db: AsyncSession,
        notification: Notification,
    ) -> Notification:
        """Mark notification as read."""
        notification.is_read = True
        await db.flush()
        return notification


complaint_notification_repository = ComplaintNotificationRepository()
