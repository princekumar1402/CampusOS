"""
CampusOS — Complaints & Notifications Service Layer (MVP)
=========================================================
Business logic for CampusFix complaints, status lifecycle, and in-app notifications.
"""
from __future__ import annotations

import uuid
from typing import Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ForbiddenError, NotFoundError, ValidationError
from app.models.complaint_notification import (
    Complaint,
    ComplaintStatus,
    Notification,
)
from app.models.user import User, UserRole
from app.repositories.complaint_notification_repository import (
    complaint_notification_repository,
)
from app.schemas.complaint_notification import ComplaintCreate


class ComplaintNotificationService:
    """Service orchestrating CampusFix complaints and in-app notifications."""

    # -----------------------------------------------------------------------
    # Complaints Business Logic
    # -----------------------------------------------------------------------

    async def create_complaint(
        self,
        db: AsyncSession,
        payload: ComplaintCreate,
        current_user: User,
    ) -> Complaint:
        """Submit a new complaint. Authorized for STUDENT role."""
        if current_user.role != UserRole.STUDENT:
            raise ForbiddenError("Only students can submit complaints.")

        complaint = Complaint(
            title=payload.title.strip(),
            description=payload.description.strip(),
            category=payload.category.strip(),
            location=payload.location.strip(),
            status=ComplaintStatus.OPEN,
            created_by=current_user.id,
        )
        return await complaint_notification_repository.create_complaint(db, complaint)

    async def get_my_complaints(
        self,
        db: AsyncSession,
        current_user: User,
    ) -> Sequence[Complaint]:
        """Fetch all complaints submitted by the authenticated student."""
        return await complaint_notification_repository.list_complaints_by_user(
            db, current_user.id
        )

    async def get_complaint(
        self,
        db: AsyncSession,
        complaint_id: uuid.UUID,
        current_user: User,
    ) -> Complaint:
        """Get complaint details. Students can only access their own complaint."""
        complaint = await complaint_notification_repository.get_complaint_by_id(
            db, complaint_id
        )
        if not complaint:
            raise NotFoundError("Complaint")

        if current_user.role != UserRole.ADMIN and complaint.created_by != current_user.id:
            raise ForbiddenError("You do not have permission to view this complaint.")

        return complaint

    async def list_all_complaints(
        self,
        db: AsyncSession,
        current_user: User,
    ) -> Sequence[Complaint]:
        """List all complaints. Authorized for ADMIN role only."""
        if current_user.role != UserRole.ADMIN:
            raise ForbiddenError("Only Administrators can view all complaints.")

        return await complaint_notification_repository.list_complaints(db)

    async def update_complaint_status(
        self,
        db: AsyncSession,
        complaint_id: uuid.UUID,
        new_status: ComplaintStatus,
        current_user: User,
    ) -> Complaint:
        """Update complaint status through allowed transitions.

        Allowed lifecycle transitions:
            OPEN -> IN_PROGRESS
            IN_PROGRESS -> RESOLVED

        All other transitions are rejected.
        Creates notification for complaint creator on valid transition.
        """
        if current_user.role != UserRole.ADMIN:
            raise ForbiddenError("Only Administrators can update complaint status.")

        complaint = await complaint_notification_repository.get_complaint_by_id(
            db, complaint_id
        )
        if not complaint:
            raise NotFoundError("Complaint")

        current_status = complaint.status

        # Validate allowed transitions
        valid = False
        notification_message = ""

        if current_status == ComplaintStatus.OPEN and new_status == ComplaintStatus.IN_PROGRESS:
            valid = True
            notification_message = f"Your complaint '{complaint.title}' is now IN_PROGRESS."
        elif current_status == ComplaintStatus.IN_PROGRESS and new_status == ComplaintStatus.RESOLVED:
            valid = True
            notification_message = f"Your complaint '{complaint.title}' has been resolved."

        if not valid:
            raise ValidationError(
                f"Invalid status transition from {current_status.value} to {new_status.value}."
            )

        # Update status
        updated = await complaint_notification_repository.update_complaint_status(
            db, complaint, new_status
        )

        # Automatically generate notification for the student
        notification = Notification(
            user_id=complaint.created_by,
            message=notification_message,
        )
        await complaint_notification_repository.create_notification(db, notification)

        return updated

    # -----------------------------------------------------------------------
    # Notifications Business Logic
    # -----------------------------------------------------------------------

    async def list_my_notifications(
        self,
        db: AsyncSession,
        current_user: User,
    ) -> Sequence[Notification]:
        """Fetch all notifications for the authenticated user."""
        return await complaint_notification_repository.list_notifications_by_user(
            db, current_user.id
        )

    async def mark_notification_as_read(
        self,
        db: AsyncSession,
        notification_id: uuid.UUID,
        current_user: User,
    ) -> Notification:
        """Mark a notification as read. Validates ownership."""
        notification = await complaint_notification_repository.get_notification_by_id(
            db, notification_id
        )
        if not notification:
            raise NotFoundError("Notification")

        if notification.user_id != current_user.id:
            raise ForbiddenError("You do not have permission to modify this notification.")

        return await complaint_notification_repository.mark_notification_as_read(
            db, notification
        )

    # Alias for endpoint compatibility
    mark_as_read = mark_notification_as_read


complaint_notification_service = ComplaintNotificationService()
