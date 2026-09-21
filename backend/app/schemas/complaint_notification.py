"""
CampusOS — Complaints & Notifications Schemas (MVP)
==================================================
Minimal Pydantic v2 validation models for Complaints and Notifications.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.complaint_notification import ComplaintStatus


class ComplaintCreate(BaseModel):
    """Payload for submitting a new complaint."""

    title: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    category: str = Field(..., min_length=1, max_length=100)
    location: str = Field(..., min_length=1, max_length=255)


class ComplaintStatusUpdate(BaseModel):
    """Payload for advancing complaint status."""

    status: ComplaintStatus


class ComplaintResponse(BaseModel):
    """Public representation of a complaint."""

    id: uuid.UUID
    title: str
    description: str
    category: str
    location: str
    status: ComplaintStatus
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationResponse(BaseModel):
    """Representation of an in-app notification."""

    id: uuid.UUID
    user_id: uuid.UUID
    message: str
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
