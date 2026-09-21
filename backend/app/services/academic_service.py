"""
CampusOS — Academic Service
===========================
Business logic for Departments, Student Profiles, and Faculty Profiles.
"""
from __future__ import annotations

import logging
import uuid
from typing import Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, NotFoundError
from app.models.academic import Department, FacultyProfile, StudentProfile
from app.repositories.academic_repository import (
    department_repository,
    faculty_profile_repository,
    student_profile_repository,
)
from app.schemas.academic import (
    DepartmentCreate,
    DepartmentUpdate,
    FacultyProfileCreate,
    FacultyProfileUpdate,
    StudentProfileCreate,
    StudentProfileUpdate,
)

logger = logging.getLogger(__name__)


class AcademicService:
    """Service handling academic management operations."""

    # -------------------------------------------------------------------------
    # Department Business Logic
    # -------------------------------------------------------------------------

    async def get_departments(self, db: AsyncSession) -> Sequence[Department]:
        """List all departments."""
        return await department_repository.get_all(db)

    async def get_department(self, db: AsyncSession, department_id: uuid.UUID) -> Department:
        """Get department by ID or raise NotFoundError."""
        dept = await department_repository.get_by_id(db, department_id)
        if not dept:
            raise NotFoundError("Department")
        return dept

    async def create_department(self, db: AsyncSession, data: DepartmentCreate) -> Department:
        """Create a department ensuring unique code."""
        existing = await department_repository.get_by_code(db, data.code)
        if existing:
            raise ConflictError(f"Department code '{data.code.upper()}' already exists.")
        dept = await department_repository.create(
            db,
            code=data.code,
            name=data.name,
            description=data.description,
        )
        logger.info("Created department code=%s name=%s", dept.code, dept.name)
        return dept

    async def update_department(
        self,
        db: AsyncSession,
        department_id: uuid.UUID,
        data: DepartmentUpdate,
    ) -> Department:
        """Update department details."""
        dept = await self.get_department(db, department_id)
        if data.code and data.code.upper() != dept.code:
            existing = await department_repository.get_by_code(db, data.code)
            if existing:
                raise ConflictError(f"Department code '{data.code.upper()}' already exists.")

        updated_dept = await department_repository.update(
            db,
            dept,
            code=data.code,
            name=data.name,
            description=data.description,
        )
        logger.info("Updated department id=%s", department_id)
        return updated_dept

    # -------------------------------------------------------------------------
    # Student Profile Business Logic
    # -------------------------------------------------------------------------

    async def get_student_profile(self, db: AsyncSession, profile_id: uuid.UUID) -> StudentProfile:
        """Get student profile by ID or raise NotFoundError."""
        profile = await student_profile_repository.get_by_id(db, profile_id)
        if not profile:
            raise NotFoundError("Student Profile")
        return profile

    async def get_student_profile_by_user(self, db: AsyncSession, user_id: uuid.UUID) -> StudentProfile:
        """Get student profile by user ID or raise NotFoundError."""
        profile = await student_profile_repository.get_by_user_id(db, user_id)
        if not profile:
            raise NotFoundError("Student Profile")
        return profile

    async def list_students(
        self,
        db: AsyncSession,
        department_id: uuid.UUID | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> Sequence[StudentProfile]:
        """List student profiles."""
        return await student_profile_repository.get_all(
            db, department_id=department_id, limit=limit, offset=offset
        )

    async def create_or_update_student_profile(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        data: StudentProfileCreate | StudentProfileUpdate,
        default_student_id: str | None = None,
    ) -> StudentProfile:
        """Create or update a student profile for user."""
        # Check student_id collision if student_id is provided
        student_id_val = getattr(data, "student_id", None) or default_student_id
        if not student_id_val:
            # Auto-generate a fallback student ID based on user_id short string if not provided
            short_id = str(user_id).split("-")[0].upper()
            student_id_val = f"STU-{short_id}"

        existing_by_student_id = await student_profile_repository.get_by_student_id(db, student_id_val)
        if existing_by_student_id and existing_by_student_id.user_id != user_id:
            raise ConflictError(f"Student ID '{student_id_val}' is already registered to another user.")

        if getattr(data, "department_id", None):
            await self.get_department(db, data.department_id)

        profile = await student_profile_repository.create_or_update(
            db,
            user_id=user_id,
            student_id=student_id_val,
            department_id=getattr(data, "department_id", None),
            program=getattr(data, "program", None) or "B.Tech Computer Science",
            batch_year=getattr(data, "batch_year", None) or 2026,
            cgpa=getattr(data, "cgpa", None),
            phone_number=getattr(data, "phone_number", None),
            bio=getattr(data, "bio", None),
            skills=getattr(data, "skills", None),
        )
        logger.info("Updated student profile for user_id=%s student_id=%s", user_id, profile.student_id)
        return profile

    # -------------------------------------------------------------------------
    # Faculty Profile Business Logic
    # -------------------------------------------------------------------------

    async def get_faculty_profile(self, db: AsyncSession, profile_id: uuid.UUID) -> FacultyProfile:
        """Get faculty profile by ID or raise NotFoundError."""
        profile = await faculty_profile_repository.get_by_id(db, profile_id)
        if not profile:
            raise NotFoundError("Faculty Profile")
        return profile

    async def get_faculty_profile_by_user(self, db: AsyncSession, user_id: uuid.UUID) -> FacultyProfile:
        """Get faculty profile by user ID or raise NotFoundError."""
        profile = await faculty_profile_repository.get_by_user_id(db, user_id)
        if not profile:
            raise NotFoundError("Faculty Profile")
        return profile

    async def list_faculty(
        self,
        db: AsyncSession,
        department_id: uuid.UUID | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> Sequence[FacultyProfile]:
        """List faculty profiles."""
        return await faculty_profile_repository.get_all(
            db, department_id=department_id, limit=limit, offset=offset
        )

    async def create_or_update_faculty_profile(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        data: FacultyProfileCreate | FacultyProfileUpdate,
        default_employee_id: str | None = None,
    ) -> FacultyProfile:
        """Create or update a faculty profile for user."""
        employee_id_val = getattr(data, "employee_id", None) or default_employee_id
        if not employee_id_val:
            short_id = str(user_id).split("-")[0].upper()
            employee_id_val = f"FAC-{short_id}"

        existing_by_emp = await faculty_profile_repository.get_by_employee_id(db, employee_id_val)
        if existing_by_emp and existing_by_emp.user_id != user_id:
            raise ConflictError(f"Employee ID '{employee_id_val}' is already registered to another faculty member.")

        if getattr(data, "department_id", None):
            await self.get_department(db, data.department_id)

        profile = await faculty_profile_repository.create_or_update(
            db,
            user_id=user_id,
            employee_id=employee_id_val,
            department_id=getattr(data, "department_id", None),
            designation=getattr(data, "designation", None) or "Assistant Professor",
            specialization=getattr(data, "specialization", None),
            office_location=getattr(data, "office_location", None),
            phone_number=getattr(data, "phone_number", None),
            bio=getattr(data, "bio", None),
        )
        logger.info("Updated faculty profile for user_id=%s employee_id=%s", user_id, profile.employee_id)
        return profile


academic_service = AcademicService()
