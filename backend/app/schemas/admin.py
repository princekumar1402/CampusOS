"""
CampusOS — Admin Pydantic Schemas
================================
Contracts for Admin Dashboard statistics and overview metrics.
"""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class AdminStatsResponse(BaseModel):
    """System-wide aggregate statistics for the Admin Dashboard."""

    students: int = Field(default=0, ge=0, description="Total registered students")
    faculty: int = Field(default=0, ge=0, description="Total faculty members")
    courses: int = Field(default=0, ge=0, description="Total courses offered")
    events: int = Field(default=0, ge=0, description="Total campus events")
    clubs: int = Field(default=0, ge=0, description="Total active student clubs")
    complaints: int = Field(default=0, ge=0, description="Total CampusFix complaints")
    open_complaints: int = Field(default=0, ge=0, description="Total open CampusFix complaints")
    internships: int = Field(default=0, ge=0, description="Total internship postings")
    applications: int = Field(default=0, ge=0, description="Total student internship applications")

    model_config = ConfigDict(extra="ignore")
