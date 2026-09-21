"""
CampusOS — Assistant & RAG Pydantic Schemas
==========================================
Defines request and response contracts for the Campus AI Assistant endpoint.
"""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field, field_validator


class AssistantQuestionRequest(BaseModel):
    """Payload for submitting a policy question to the Campus AI Assistant."""

    question: str = Field(
        ...,
        min_length=2,
        max_length=500,
        description="User question regarding campus policies, guidelines, or procedures.",
        examples=["What is the attendance requirement?"],
    )

    @field_validator("question")
    @classmethod
    def validate_question(cls, value: str) -> str:
        trimmed = value.strip()
        if len(trimmed) < 2:
            raise ValueError("Question must be at least 2 characters after trimming whitespace.")
        return trimmed


class AssistantSource(BaseModel):
    """Source reference for the grounded answer."""

    document: str = Field(..., description="The source markdown policy document filename.")
    section: str | None = Field(default=None, description="The specific policy section heading.")

    model_config = ConfigDict(extra="ignore")


class AssistantAnswerResponse(BaseModel):
    """Grounded answer generated from policy documents with sources."""

    answer: str = Field(..., description="Grounded answer to the question.")
    sources: list[AssistantSource] = Field(
        default_factory=list,
        description="List of verified policy sources used to generate the answer.",
    )

    model_config = ConfigDict(extra="ignore")
