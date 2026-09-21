"""
CampusOS — Department Endpoints
================================
API routes for Department management.
"""
from __future__ import annotations

import uuid
from typing import Sequence

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies.auth import require_authenticated_user, require_role
from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.academic import (
    DepartmentCreate,
    DepartmentResponse,
    DepartmentUpdate,
)
from app.services.academic_service import academic_service

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.get(
    "",
    response_model=list[DepartmentResponse],
    summary="List all departments",
    description="Retrieve all academic departments in the university.",
)
async def list_departments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
) -> Sequence[DepartmentResponse]:
    """Get list of departments."""
    return await academic_service.get_departments(db)


@router.get(
    "/{department_id}",
    response_model=DepartmentResponse,
    summary="Get department details",
    description="Fetch a specific department by ID.",
)
async def get_department(
    department_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_authenticated_user),
) -> DepartmentResponse:
    """Get department by ID."""
    return await academic_service.get_department(db, department_id)


@router.post(
    "",
    response_model=DepartmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new department",
    description="Create an academic department. Requires ADMIN role.",
)
async def create_department(
    department_in: DepartmentCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_role(UserRole.ADMIN)),
) -> DepartmentResponse:
    """Create department (Admin only)."""
    return await academic_service.create_department(db, department_in)


@router.put(
    "/{department_id}",
    response_model=DepartmentResponse,
    summary="Update a department",
    description="Update department details. Requires ADMIN role.",
)
async def update_department(
    department_id: uuid.UUID,
    department_in: DepartmentUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_role(UserRole.ADMIN)),
) -> DepartmentResponse:
    """Update department (Admin only)."""
    return await academic_service.update_department(db, department_id, department_in)
