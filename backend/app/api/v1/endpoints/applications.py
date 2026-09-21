"""
CampusOS — Application Endpoints
=================================
REST APIs for student internship applications.
"""
from __future__ import annotations

from typing import Sequence

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies.auth import require_role
from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.internship import ApplicationResponse
from app.services.internship_service import internship_service

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.get(
    "/me",
    response_model=list[ApplicationResponse],
    summary="View own internship applications",
    description="Student fetches all internship applications they have submitted.",
)
async def get_my_applications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.STUDENT)),
) -> Sequence[ApplicationResponse]:
    """List applications for the current student."""
    return await internship_service.list_my_applications(db, current_user)
