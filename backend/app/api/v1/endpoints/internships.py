"""
CampusOS — Internship Endpoints
================================
REST APIs for browsing, creating, and applying to internships.
"""
from __future__ import annotations

import uuid
from typing import Sequence

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies.auth import require_authenticated_user, require_role
from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.internship import (
    ApplicationResponse,
    InternshipCreate,
    InternshipResponse,
)
from app.services.internship_service import internship_service

router = APIRouter(prefix="/internships", tags=["Internships"])


@router.get(
    "",
    response_model=list[InternshipResponse],
    summary="List available internships",
    description="Browse active internships with skill match evaluation for students.",
)
async def list_internships(
    offset: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
) -> Sequence[InternshipResponse]:
    """List available internships."""
    return await internship_service.list_internships(
        db, current_user=current_user, offset=offset, limit=limit
    )


@router.post(
    "",
    response_model=InternshipResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an internship opportunity",
    description="Authorized Staff/Admin can create a new internship posting.",
)
async def create_internship(
    data: InternshipCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.FACULTY)),
) -> InternshipResponse:
    """Create an internship (Admin/Faculty)."""
    return await internship_service.create_internship(db, current_user, data)


@router.get(
    "/{internship_id}",
    response_model=InternshipResponse,
    summary="Get internship details",
    description="Fetch details of an internship opportunity including skill-match overlap.",
)
async def get_internship(
    internship_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
) -> InternshipResponse:
    """Get single internship by ID."""
    return await internship_service.get_internship(db, internship_id, current_user)


@router.post(
    "/{internship_id}/apply",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Apply to an internship",
    description="Student submits an application to an internship. Rejects duplicates.",
)
async def apply_to_internship(
    internship_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.STUDENT)),
) -> ApplicationResponse:
    """Apply to an internship (Student only)."""
    return await internship_service.apply_to_internship(db, current_user, internship_id)
