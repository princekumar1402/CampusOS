"""
CampusOS — Internship & Application Service
============================================
Business logic for internships, applications, and deterministic skill matching.
"""
from __future__ import annotations

import logging
import uuid
from typing import Optional, Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import (
    ConflictError,
    ForbiddenError,
    NotFoundError,
    ValidationError,
)
from app.models.internship import Internship, InternshipApplication
from app.models.user import User, UserRole
from app.repositories.academic_repository import student_profile_repository
from app.repositories.internship_repository import internship_repository
from app.schemas.internship import (
    ApplicationResponse,
    InternshipCreate,
    InternshipResponse,
    SkillMatchResponse,
)

logger = logging.getLogger(__name__)


def parse_skills_list(skills_input: list[str] | str | None) -> list[str]:
    """Parse comma-separated string or list into deduplicated list preserving original display casing."""
    if not skills_input:
        return []
    if isinstance(skills_input, str):
        items = [s.strip() for s in skills_input.split(",") if s.strip()]
    else:
        items = []
        for item in skills_input:
            if isinstance(item, str):
                items.extend([s.strip() for s in item.split(",") if s.strip()])
    # Deduplicate while preserving order & first seen casing
    seen_lower: set[str] = set()
    result: list[str] = []
    for item in items:
        norm = item.lower()
        if norm not in seen_lower:
            seen_lower.add(norm)
            result.append(item)
    return result


def calculate_skill_match(
    required_skills_input: list[str] | str,
    student_skills_input: list[str] | str | None,
) -> SkillMatchResponse:
    """Calculate deterministic and explainable skill-overlap.

    Rules:
    - Normalize skill names (case-insensitive, whitespace trimmed, deduplicated).
    - Return matched_skills, missing_skills, total_required, match_percentage.
    """
    required_list = parse_skills_list(required_skills_input)
    student_list = parse_skills_list(student_skills_input)
    student_norm_set = {s.lower() for s in student_list}

    matched = [req for req in required_list if req.lower() in student_norm_set]
    missing = [req for req in required_list if req.lower() not in student_norm_set]
    total_required = len(required_list)

    if total_required > 0:
        match_percentage = round((len(matched) / total_required) * 100, 1)
    else:
        match_percentage = 0.0

    return SkillMatchResponse(
        matched_skills=matched,
        missing_skills=missing,
        total_required=total_required,
        match_percentage=match_percentage,
    )


class InternshipService:
    """Service orchestrating internships, applications, and skill matching."""

    async def create_internship(
        self,
        db: AsyncSession,
        current_user: User,
        data: InternshipCreate,
    ) -> InternshipResponse:
        """Create a new internship listing (Admin & Faculty only)."""
        if current_user.role not in (UserRole.ADMIN, UserRole.FACULTY):
            raise ForbiddenError("Students cannot create internships.")

        # Serialize required skills into comma-separated string
        skills_list = parse_skills_list(data.required_skills)
        if not skills_list:
            raise ValidationError("At least one required skill is required.")
        skills_str = ", ".join(skills_list)

        internship = await internship_repository.create_internship(
            db,
            title=data.title,
            company=data.company,
            description=data.description,
            required_skills=skills_str,
            location=data.location,
            mode=data.mode,
            created_by=current_user.id,
        )
        logger.info("Internship created id=%s title=%s by user=%s", internship.id, internship.title, current_user.id)
        return self._to_response(internship, skills_list=skills_list)

    async def list_internships(
        self,
        db: AsyncSession,
        current_user: User,
        offset: int = 0,
        limit: int = 100,
    ) -> list[InternshipResponse]:
        """List all available internships, computing skill match and applied status for students."""
        internships = await internship_repository.list_all(db, offset=offset, limit=limit)

        student_skills: Optional[str] = None
        applied_ids: set[uuid.UUID] = set()
        is_student = current_user.role == UserRole.STUDENT

        if is_student:
            profile = await student_profile_repository.get_by_user_id(db, current_user.id)
            if profile:
                student_skills = getattr(profile, "skills", None)
                applied_ids = await internship_repository.get_applied_internship_ids(db, profile.id)

        responses: list[InternshipResponse] = []
        for item in internships:
            skills_list = parse_skills_list(item.required_skills)
            skill_match = None
            if is_student:
                skill_match = calculate_skill_match(skills_list, student_skills)
            has_applied = item.id in applied_ids

            responses.append(
                self._to_response(
                    item,
                    skills_list=skills_list,
                    skill_match=skill_match,
                    has_applied=has_applied,
                )
            )
        return responses

    async def get_internship(
        self,
        db: AsyncSession,
        internship_id: uuid.UUID,
        current_user: User,
    ) -> InternshipResponse:
        """Fetch internship details with skill match calculation for students."""
        internship = await internship_repository.get_by_id(db, internship_id)
        if not internship:
            raise NotFoundError("Internship")

        skills_list = parse_skills_list(internship.required_skills)
        skill_match = None
        has_applied = False

        if current_user.role == UserRole.STUDENT:
            profile = await student_profile_repository.get_by_user_id(db, current_user.id)
            if profile:
                skill_match = calculate_skill_match(skills_list, getattr(profile, "skills", None))
                existing = await internship_repository.get_application(db, internship_id, profile.id)
                has_applied = existing is not None

        return self._to_response(
            internship,
            skills_list=skills_list,
            skill_match=skill_match,
            has_applied=has_applied,
        )

    async def apply_to_internship(
        self,
        db: AsyncSession,
        current_user: User,
        internship_id: uuid.UUID,
    ) -> ApplicationResponse:
        """Student applies to an internship. Rejects duplicate applications."""
        if current_user.role != UserRole.STUDENT:
            raise ForbiddenError("Only students can apply to internships.")

        profile = await student_profile_repository.get_by_user_id(db, current_user.id)
        if not profile:
            raise NotFoundError("Student Profile")

        internship = await internship_repository.get_by_id(db, internship_id)
        if not internship:
            raise NotFoundError("Internship")

        # Check duplicate
        existing = await internship_repository.get_application(db, internship_id, profile.id)
        if existing:
            raise ConflictError("You have already applied to this internship.")

        application = await internship_repository.create_application(
            db,
            internship_id=internship_id,
            student_profile_id=profile.id,
        )
        logger.info(
            "Student applied to internship student_profile_id=%s internship_id=%s",
            profile.id,
            internship_id,
        )
        skills_list = parse_skills_list(internship.required_skills)
        internship_resp = self._to_response(internship, skills_list=skills_list, has_applied=True)

        return ApplicationResponse(
            id=application.id,
            internship_id=application.internship_id,
            student_profile_id=application.student_profile_id,
            status=application.status,
            applied_at=application.applied_at,
            internship=internship_resp,
        )

    async def list_my_applications(
        self,
        db: AsyncSession,
        current_user: User,
    ) -> list[ApplicationResponse]:
        """Student views their own submitted applications."""
        if current_user.role != UserRole.STUDENT:
            raise ForbiddenError("Only students have internship applications.")

        profile = await student_profile_repository.get_by_user_id(db, current_user.id)
        if not profile:
            return []

        applications = await internship_repository.list_student_applications(db, profile.id)
        result: list[ApplicationResponse] = []
        for app in applications:
            internship_resp = None
            if app.internship:
                skills_list = parse_skills_list(app.internship.required_skills)
                internship_resp = self._to_response(app.internship, skills_list=skills_list, has_applied=True)
            result.append(
                ApplicationResponse(
                    id=app.id,
                    internship_id=app.internship_id,
                    student_profile_id=app.student_profile_id,
                    status=app.status,
                    applied_at=app.applied_at,
                    internship=internship_resp,
                )
            )
        return result

    def _to_response(
        self,
        internship: Internship,
        *,
        skills_list: list[str],
        skill_match: Optional[SkillMatchResponse] = None,
        has_applied: bool = False,
    ) -> InternshipResponse:
        """Helper to build InternshipResponse."""
        return InternshipResponse(
            id=internship.id,
            title=internship.title,
            company=internship.company,
            description=internship.description,
            required_skills=skills_list,
            location=internship.location,
            mode=internship.mode,
            created_by=internship.created_by,
            created_at=internship.created_at,
            skill_match=skill_match,
            has_applied=has_applied,
        )


internship_service = InternshipService()
