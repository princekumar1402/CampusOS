"""
CampusOS — Academic Repositories
================================
Database operations for Department, StudentProfile, and FacultyProfile entities.
"""
from __future__ import annotations

import uuid
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.academic import Department, FacultyProfile, StudentProfile


class DepartmentRepository:
    """Repository handling database operations for Department records."""

    async def get_by_id(self, db: AsyncSession, department_id: uuid.UUID) -> Department | None:
        """Fetch department by primary key ID."""
        stmt = select(Department).where(Department.id == department_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_code(self, db: AsyncSession, code: str) -> Department | None:
        """Fetch department by uppercase code (e.g. 'CS')."""
        normalized_code = code.strip().upper()
        stmt = select(Department).where(Department.code == normalized_code)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all(self, db: AsyncSession) -> Sequence[Department]:
        """Fetch all departments ordered by code."""
        stmt = select(Department).order_by(Department.code)
        result = await db.execute(stmt)
        return result.scalars().all()

    async def create(
        self,
        db: AsyncSession,
        *,
        code: str,
        name: str,
        description: str | None = None,
    ) -> Department:
        """Create a new department."""
        dept = Department(
            code=code.strip().upper(),
            name=name.strip(),
            description=description.strip() if description else None,
        )
        db.add(dept)
        await db.flush()
        return dept

    async def update(
        self,
        db: AsyncSession,
        department: Department,
        *,
        code: str | None = None,
        name: str | None = None,
        description: str | None = None,
    ) -> Department:
        """Update department fields."""
        if code is not None:
            department.code = code.strip().upper()
        if name is not None:
            department.name = name.strip()
        if description is not None:
            department.description = description.strip() if description else None
        await db.flush()
        return department


class StudentProfileRepository:
    """Repository handling database operations for StudentProfile records."""

    async def get_by_id(self, db: AsyncSession, profile_id: uuid.UUID) -> StudentProfile | None:
        """Fetch student profile by ID with user and department loaded."""
        stmt = (
            select(StudentProfile)
            .options(
                selectinload(StudentProfile.user),
                selectinload(StudentProfile.department),
            )
            .where(StudentProfile.id == profile_id)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_user_id(self, db: AsyncSession, user_id: uuid.UUID) -> StudentProfile | None:
        """Fetch student profile by associated User ID."""
        stmt = (
            select(StudentProfile)
            .options(
                selectinload(StudentProfile.user),
                selectinload(StudentProfile.department),
            )
            .where(StudentProfile.user_id == user_id)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_student_id(self, db: AsyncSession, student_id: str) -> StudentProfile | None:
        """Fetch student profile by roll/student ID."""
        stmt = (
            select(StudentProfile)
            .options(
                selectinload(StudentProfile.user),
                selectinload(StudentProfile.department),
            )
            .where(StudentProfile.student_id == student_id.strip())
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all(
        self,
        db: AsyncSession,
        department_id: uuid.UUID | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> Sequence[StudentProfile]:
        """Fetch student profiles with optional department filter."""
        stmt = select(StudentProfile).options(
            selectinload(StudentProfile.user),
            selectinload(StudentProfile.department),
        )
        if department_id:
            stmt = stmt.where(StudentProfile.department_id == department_id)
        stmt = stmt.order_by(StudentProfile.student_id).offset(offset).limit(limit)
        result = await db.execute(stmt)
        return result.scalars().all()

    async def create_or_update(
        self,
        db: AsyncSession,
        *,
        user_id: uuid.UUID,
        student_id: str,
        department_id: uuid.UUID | None = None,
        program: str = "B.Tech Computer Science",
        batch_year: int = 2026,
        cgpa: float | None = None,
        phone_number: str | None = None,
        bio: str | None = None,
        skills: str | None = None,
    ) -> StudentProfile:
        """Create or update a student profile for a given user."""
        profile = await self.get_by_user_id(db, user_id)
        if profile is None:
            profile = StudentProfile(
                user_id=user_id,
                student_id=student_id.strip(),
                department_id=department_id,
                program=program.strip(),
                batch_year=batch_year,
                cgpa=cgpa,
                phone_number=phone_number.strip() if phone_number else None,
                bio=bio.strip() if bio else None,
                skills=skills.strip() if skills else "",
            )
            db.add(profile)
        else:
            profile.student_id = student_id.strip()
            if department_id is not None:
                profile.department_id = department_id
            if program:
                profile.program = program.strip()
            if batch_year:
                profile.batch_year = batch_year
            if cgpa is not None:
                profile.cgpa = cgpa
            if phone_number is not None:
                profile.phone_number = phone_number.strip() if phone_number else None
            if bio is not None:
                profile.bio = bio.strip() if bio else None
            if skills is not None:
                profile.skills = skills.strip()

        await db.flush()
        # Re-fetch with loaded relationships
        return await self.get_by_id(db, profile.id)  # type: ignore[return-value]


class FacultyProfileRepository:
    """Repository handling database operations for FacultyProfile records."""

    async def get_by_id(self, db: AsyncSession, profile_id: uuid.UUID) -> FacultyProfile | None:
        """Fetch faculty profile by ID with user and department loaded."""
        stmt = (
            select(FacultyProfile)
            .options(
                selectinload(FacultyProfile.user),
                selectinload(FacultyProfile.department),
            )
            .where(FacultyProfile.id == profile_id)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_user_id(self, db: AsyncSession, user_id: uuid.UUID) -> FacultyProfile | None:
        """Fetch faculty profile by associated User ID."""
        stmt = (
            select(FacultyProfile)
            .options(
                selectinload(FacultyProfile.user),
                selectinload(FacultyProfile.department),
            )
            .where(FacultyProfile.user_id == user_id)
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_employee_id(self, db: AsyncSession, employee_id: str) -> FacultyProfile | None:
        """Fetch faculty profile by employee ID."""
        stmt = (
            select(FacultyProfile)
            .options(
                selectinload(FacultyProfile.user),
                selectinload(FacultyProfile.department),
            )
            .where(FacultyProfile.employee_id == employee_id.strip())
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all(
        self,
        db: AsyncSession,
        department_id: uuid.UUID | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> Sequence[FacultyProfile]:
        """Fetch faculty profiles with optional department filter."""
        stmt = select(FacultyProfile).options(
            selectinload(FacultyProfile.user),
            selectinload(FacultyProfile.department),
        )
        if department_id:
            stmt = stmt.where(FacultyProfile.department_id == department_id)
        stmt = stmt.order_by(FacultyProfile.employee_id).offset(offset).limit(limit)
        result = await db.execute(stmt)
        return result.scalars().all()

    async def create_or_update(
        self,
        db: AsyncSession,
        *,
        user_id: uuid.UUID,
        employee_id: str,
        department_id: uuid.UUID | None = None,
        designation: str = "Assistant Professor",
        specialization: str | None = None,
        office_location: str | None = None,
        phone_number: str | None = None,
        bio: str | None = None,
    ) -> FacultyProfile:
        """Create or update a faculty profile for a given user."""
        profile = await self.get_by_user_id(db, user_id)
        if profile is None:
            profile = FacultyProfile(
                user_id=user_id,
                employee_id=employee_id.strip(),
                department_id=department_id,
                designation=designation.strip(),
                specialization=specialization.strip() if specialization else None,
                office_location=office_location.strip() if office_location else None,
                phone_number=phone_number.strip() if phone_number else None,
                bio=bio.strip() if bio else None,
            )
            db.add(profile)
        else:
            profile.employee_id = employee_id.strip()
            if department_id is not None:
                profile.department_id = department_id
            if designation:
                profile.designation = designation.strip()
            if specialization is not None:
                profile.specialization = specialization.strip() if specialization else None
            if office_location is not None:
                profile.office_location = office_location.strip() if office_location else None
            if phone_number is not None:
                profile.phone_number = phone_number.strip() if phone_number else None
            if bio is not None:
                profile.bio = bio.strip() if bio else None

        await db.flush()
        return await self.get_by_id(db, profile.id)  # type: ignore[return-value]


department_repository = DepartmentRepository()
student_profile_repository = StudentProfileRepository()
faculty_profile_repository = FacultyProfileRepository()
