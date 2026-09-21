"""
CampusOS — Internship & Application Repository
===============================================
SQLAlchemy queries for Internships and Applications.
"""
from __future__ import annotations

import uuid
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.internship import Internship, InternshipApplication


class InternshipRepository:
    """Repository handling database operations for Internships and Applications."""

    async def create_internship(
        self,
        db: AsyncSession,
        *,
        title: str,
        company: str,
        description: str,
        required_skills: str,
        location: str,
        mode: str,
        created_by: uuid.UUID,
    ) -> Internship:
        """Create a new internship opportunity."""
        internship = Internship(
            id=uuid.uuid4(),
            title=title.strip(),
            company=company.strip(),
            description=description.strip(),
            required_skills=required_skills.strip(),
            location=location.strip(),
            mode=mode.strip(),
            created_by=created_by,
        )
        db.add(internship)
        await db.flush()
        await db.refresh(internship)
        return internship

    async def get_by_id(self, db: AsyncSession, internship_id: uuid.UUID) -> Internship | None:
        """Fetch internship by its ID."""
        stmt = select(Internship).where(Internship.id == internship_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(
        self,
        db: AsyncSession,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[Internship]:
        """Fetch all internships ordered by created_at descending."""
        stmt = (
            select(Internship)
            .order_by(Internship.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    async def get_application(
        self,
        db: AsyncSession,
        internship_id: uuid.UUID,
        student_profile_id: uuid.UUID,
    ) -> InternshipApplication | None:
        """Fetch application by internship and student profile."""
        stmt = select(InternshipApplication).where(
            InternshipApplication.internship_id == internship_id,
            InternshipApplication.student_profile_id == student_profile_id,
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_application(
        self,
        db: AsyncSession,
        *,
        internship_id: uuid.UUID,
        student_profile_id: uuid.UUID,
    ) -> InternshipApplication:
        """Create a new application."""
        application = InternshipApplication(
            id=uuid.uuid4(),
            internship_id=internship_id,
            student_profile_id=student_profile_id,
            status="APPLIED",
        )
        db.add(application)
        await db.flush()
        await db.refresh(application)
        return application

    async def list_student_applications(
        self,
        db: AsyncSession,
        student_profile_id: uuid.UUID,
    ) -> Sequence[InternshipApplication]:
        """Fetch all applications for a student with internship preloaded."""
        stmt = (
            select(InternshipApplication)
            .options(selectinload(InternshipApplication.internship))
            .where(InternshipApplication.student_profile_id == student_profile_id)
            .order_by(InternshipApplication.applied_at.desc())
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    async def get_applied_internship_ids(
        self,
        db: AsyncSession,
        student_profile_id: uuid.UUID,
    ) -> set[uuid.UUID]:
        """Fetch set of internship IDs already applied to by student."""
        stmt = select(InternshipApplication.internship_id).where(
            InternshipApplication.student_profile_id == student_profile_id
        )
        result = await db.execute(stmt)
        return set(result.scalars().all())


internship_repository = InternshipRepository()
