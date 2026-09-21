"""
CampusOS — Events & Clubs Schemas (MVP)
======================================
Minimal Pydantic v2 validation models for Events and Clubs.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Events Schemas
# ---------------------------------------------------------------------------


class EventCreate(BaseModel):
    """Payload for creating a new event."""

    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    date_time: datetime
    location: str = Field(..., min_length=1, max_length=255)


class EventResponse(BaseModel):
    """Public representation of an event."""

    id: uuid.UUID
    title: str
    description: Optional[str] = None
    date_time: datetime
    location: str
    created_by: uuid.UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EventRegistrationResponse(BaseModel):
    """Representation of an event registration."""

    id: uuid.UUID
    event_id: uuid.UUID
    student_profile_id: uuid.UUID
    registered_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Clubs Schemas
# ---------------------------------------------------------------------------


class ClubCreate(BaseModel):
    """Payload for creating a new club."""

    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: str = Field(..., min_length=1, max_length=100)


class ClubResponse(BaseModel):
    """Public representation of a club."""

    id: uuid.UUID
    name: str
    description: Optional[str] = None
    category: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ClubMembershipResponse(BaseModel):
    """Representation of a club membership."""

    id: uuid.UUID
    club_id: uuid.UUID
    student_profile_id: uuid.UUID
    joined_at: datetime

    model_config = ConfigDict(from_attributes=True)
