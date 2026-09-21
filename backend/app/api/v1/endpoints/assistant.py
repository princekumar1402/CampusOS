"""
CampusOS — Campus AI Assistant Endpoint
======================================
Provides the grounded campus-policy question-answering endpoint.
"""
from __future__ import annotations

import logging
from fastapi import APIRouter, Depends, status

from app.api.v1.dependencies.auth import require_authenticated_user
from app.models.user import User
from app.schemas.assistant import AssistantAnswerResponse, AssistantQuestionRequest
from app.services.rag_service import rag_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/assistant", tags=["Campus AI Assistant"])


@router.post(
    "/ask",
    response_model=AssistantAnswerResponse,
    status_code=status.HTTP_200_OK,
    summary="Ask Campus Policy Question",
    description=(
        "Submits a policy question to the Campus AI Assistant. Uses RAG over campus policy "
        "documents (attendance, maintenance/CampusFix, internships, clubs, and academic guidelines) "
        "to return a concise, grounded answer with source citations."
    ),
)
async def ask_assistant(
    payload: AssistantQuestionRequest,
    current_user: User = Depends(require_authenticated_user),
) -> AssistantAnswerResponse:
    """
    1. Authenticate user via JWT Bearer token
    2. Validate question input
    3. Retrieve relevant chunks via FAISS vector store
    4. Generate grounded answer
    5. Return answer + source citations
    """
    logger.info("User %s asking assistant: '%s'", current_user.id, payload.question)
    return await rag_service.answer_question(payload.question)
