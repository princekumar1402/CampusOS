"""
CampusOS — Internship & Application Schemas
============================================
Pydantic v2 schemas for Internships, Applications, and Skill Matching.
"""
from __future__ import annotations

from datetime import datetime
from uuid import UUID
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class SkillMatchResponse(BaseModel):
    """Explainable skill matching result between student and internship."""

    matched_skills: list[str] = Field(default_factory=list, description="Skills present in both student profile and internship")
    missing_skills: list[str] = Field(default_factory=list, description="Required skills absent from student profile")
    total_required: int = Field(0, description="Total count of required skills for this internship")
    match_percentage: float = Field(0.0, description="Overlap percentage rounded to 1 decimal place")


class InternshipCreate(BaseModel):
    """Payload for creating a new internship opportunity."""

    title: str = Field(..., min_length=2, max_length=255, description="Internship title")
    company: str = Field(..., min_length=2, max_length=255, description="Company / organization name")
    description: str = Field(..., min_length=10, description="Role description and responsibilities")
    required_skills: list[str] | str = Field(..., description="Required skills list or comma-separated string")
    location: str = Field(..., min_length=2, max_length=255, description="Office location or Remote")
    mode: str = Field("Remote", max_length=50, description="Work mode: Remote, On-site, or Hybrid")


class InternshipResponse(BaseModel):
    """Internship response model."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    company: str
    description: str
    required_skills: list[str]
    location: str
    mode: str
    created_by: UUID
    created_at: datetime
    skill_match: Optional[SkillMatchResponse] = None
    has_applied: Optional[bool] = False


class ApplicationResponse(BaseModel):
    """Internship application response model."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    internship_id: UUID
    student_profile_id: UUID
    status: str
    applied_at: datetime
    internship: Optional[InternshipResponse] = None
