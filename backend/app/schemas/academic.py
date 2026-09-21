"""
CampusOS — Academic & Profile Schemas
=====================================
Pydantic v2 schemas for Departments, Student Profiles, and Faculty Profiles.
"""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.auth import UserResponse

# =============================================================================
# Department Schemas
# =============================================================================


class DepartmentBase(BaseModel):
    """Base department properties."""

    code: str = Field(..., min_length=2, max_length=20, description="Department code (e.g. CS, EE)")
    name: str = Field(..., min_length=2, max_length=255, description="Full department name")
    description: str | None = Field(None, description="Department summary or details")


class DepartmentCreate(DepartmentBase):
    """Payload for creating a new department."""

    pass


class DepartmentUpdate(BaseModel):
    """Payload for updating an existing department."""

    code: str | None = Field(None, min_length=2, max_length=20)
    name: str | None = Field(None, min_length=2, max_length=255)
    description: str | None = None


class DepartmentResponse(DepartmentBase):
    """Department output model."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


# =============================================================================
# Student Profile Schemas
# =============================================================================


class StudentProfileBase(BaseModel):
    """Base student profile properties."""

    student_id: str = Field(..., min_length=3, max_length=50, description="Unique roll/student ID")
    program: str = Field("B.Tech Computer Science", max_length=100)
    batch_year: int = Field(2026, ge=2000, le=2100)
    cgpa: float | None = Field(None, ge=0.0, le=10.0)
    phone_number: str | None = Field(None, max_length=20)
    bio: str | None = None
    skills: str | None = None


class StudentProfileCreate(BaseModel):
    """Payload for initializing or creating a student profile."""

    student_id: str = Field(..., min_length=3, max_length=50)
    department_id: UUID | None = None
    program: str = "B.Tech Computer Science"
    batch_year: int = 2026
    cgpa: float | None = None
    phone_number: str | None = None
    bio: str | None = None
    skills: str | None = None


class StudentProfileUpdate(BaseModel):
    """Payload for updating current student profile."""

    department_id: UUID | None = None
    program: str | None = None
    batch_year: int | None = None
    cgpa: float | None = None
    phone_number: str | None = None
    bio: str | None = None
    skills: str | None = None


class StudentProfileResponse(BaseModel):
    """Full student profile response with user and department details."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    student_id: str
    department_id: UUID | None = None
    program: str
    batch_year: int
    cgpa: float | None = None
    phone_number: str | None = None
    bio: str | None = None
    skills: str | None = None
    created_at: datetime
    updated_at: datetime

    user: UserResponse
    department: DepartmentResponse | None = None


# =============================================================================
# Faculty Profile Schemas
# =============================================================================


class FacultyProfileBase(BaseModel):
    """Base faculty profile properties."""

    employee_id: str = Field(..., min_length=3, max_length=50, description="Unique faculty/employee ID")
    designation: str = Field("Assistant Professor", max_length=100)
    specialization: str | None = Field(None, max_length=255)
    office_location: str | None = Field(None, max_length=100)
    phone_number: str | None = Field(None, max_length=20)
    bio: str | None = None


class FacultyProfileCreate(BaseModel):
    """Payload for creating a faculty profile."""

    employee_id: str = Field(..., min_length=3, max_length=50)
    department_id: UUID | None = None
    designation: str = "Assistant Professor"
    specialization: str | None = None
    office_location: str | None = None
    phone_number: str | None = None
    bio: str | None = None


class FacultyProfileUpdate(BaseModel):
    """Payload for updating current faculty profile."""

    department_id: UUID | None = None
    designation: str | None = None
    specialization: str | None = None
    office_location: str | None = None
    phone_number: str | None = None
    bio: str | None = None


class FacultyProfileResponse(BaseModel):
    """Full faculty profile response with user and department details."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    employee_id: str
    department_id: UUID | None = None
    designation: str
    specialization: str | None = None
    office_location: str | None = None
    phone_number: str | None = None
    bio: str | None = None
    created_at: datetime
    updated_at: datetime

    user: UserResponse
    department: DepartmentResponse | None = None
