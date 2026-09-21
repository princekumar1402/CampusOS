"""
CampusOS — Day 6 Campus AI Assistant + RAG MVP Tests
===================================================
Comprehensive test suite verifying:
1. Endpoint authentication requirements (401 when unauthenticated)
2. Question validation (empty or whitespace-only rejected with 422)
3. Quality retrieval for attendance policy
4. Quality retrieval for CampusFix / maintenance policy
5. Quality retrieval for internship / career policy
6. Quality retrieval for events and clubs policy
7. Quality retrieval for academic guidelines
8. Out-of-scope / unrelated question fallback gating
9. Clean source metadata (no embeddings or vector IDs exposed)
10. Resilient handling when external LLM calls fail
11. External LLM response integration via mock
"""
from __future__ import annotations

from unittest.mock import AsyncMock, patch
import pytest
from httpx import AsyncClient

from app.core.security import create_access_token
from app.models.user import User, UserRole
from app.schemas.auth import UserRegisterRequest
from app.services.auth_service import auth_service
from app.services.rag_service import FALLBACK_MESSAGE, rag_service


async def create_test_student(db_session) -> tuple[User, dict[str, str]]:
    """Helper to create and authenticate a test student."""
    user = await auth_service.register(
        db_session,
        UserRegisterRequest(
            full_name="AI Student Tester",
            email="ai_student@test.campusos.edu",
            password="StrongPassword123!",
        ),
    )
    token = create_access_token(user.id, role=UserRole.STUDENT)
    headers = {"Authorization": f"Bearer {token}"}
    return user, headers


@pytest.mark.asyncio
async def test_assistant_endpoint_requires_auth(client: AsyncClient) -> None:
    """Unauthenticated requests to /api/v1/assistant/ask must return 401 Unauthorized."""
    response = await client.post(
        "/api/v1/assistant/ask",
        json={"question": "What is the attendance requirement?"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_assistant_empty_question_rejected(
    client: AsyncClient, db_session
) -> None:
    """Empty question string must be rejected with 422 Unprocessable Entity."""
    _, headers = await create_test_student(db_session)
    response = await client.post(
        "/api/v1/assistant/ask",
        json={"question": ""},
        headers=headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_assistant_whitespace_question_rejected(
    client: AsyncClient, db_session
) -> None:
    """Whitespace-only question string must be rejected with 422 Unprocessable Entity."""
    _, headers = await create_test_student(db_session)
    response = await client.post(
        "/api/v1/assistant/ask",
        json={"question": "   \n\t  "},
        headers=headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_assistant_attendance_question_retrieves_attendance_policy(
    client: AsyncClient, db_session
) -> None:
    """Asking about attendance requirement retrieves attendance_policy.md and answers 75%."""
    _, headers = await create_test_student(db_session)
    response = await client.post(
        "/api/v1/assistant/ask",
        json={"question": "What is the attendance requirement?"},
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "sources" in data
    assert "75%" in data["answer"] or "attendance" in data["answer"].lower()

    source_docs = [s["document"] for s in data["sources"]]
    assert "attendance_policy.md" in source_docs


@pytest.mark.asyncio
async def test_assistant_campusfix_question_retrieves_campusfix_policy(
    client: AsyncClient, db_session
) -> None:
    """Asking about reporting campus issues retrieves campusfix_policy.md."""
    _, headers = await create_test_student(db_session)
    response = await client.post(
        "/api/v1/assistant/ask",
        json={"question": "How do I report a campus maintenance problem?"},
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "sources" in data

    source_docs = [s["document"] for s in data["sources"]]
    assert "campusfix_policy.md" in source_docs
    assert "CampusFix" in data["answer"] or "maintenance" in data["answer"].lower()


@pytest.mark.asyncio
async def test_assistant_internship_question_retrieves_internship_policy(
    client: AsyncClient, db_session
) -> None:
    """Asking about internship rules retrieves internship_policy.md."""
    _, headers = await create_test_student(db_session)
    response = await client.post(
        "/api/v1/assistant/ask",
        json={"question": "How can I apply for an internship?"},
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "sources" in data

    source_docs = [s["document"] for s in data["sources"]]
    assert "internship_policy.md" in source_docs
    assert "internship" in data["answer"].lower()


@pytest.mark.asyncio
async def test_assistant_events_clubs_question_retrieves_events_policy(
    client: AsyncClient, db_session
) -> None:
    """Asking about joining student clubs retrieves events_clubs_policy.md."""
    _, headers = await create_test_student(db_session)
    response = await client.post(
        "/api/v1/assistant/ask",
        json={"question": "What is the process for joining a student club?"},
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "sources" in data

    source_docs = [s["document"] for s in data["sources"]]
    assert "events_clubs_policy.md" in source_docs
    assert "club" in data["answer"].lower() or "event" in data["answer"].lower()


@pytest.mark.asyncio
async def test_assistant_academic_guidelines_retrieval(
    client: AsyncClient, db_session
) -> None:
    """Asking about course registration rules retrieves academic_guidelines.md."""
    _, headers = await create_test_student(db_session)
    response = await client.post(
        "/api/v1/assistant/ask",
        json={"question": "What are the rules for course registration and academic credits?"},
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "sources" in data

    source_docs = [s["document"] for s in data["sources"]]
    assert "academic_guidelines.md" in source_docs


@pytest.mark.asyncio
async def test_assistant_unrelated_question_returns_fallback(
    client: AsyncClient, db_session
) -> None:
    """Unrelated questions out of campus scope return exact fallback answer and empty sources."""
    _, headers = await create_test_student(db_session)
    response = await client.post(
        "/api/v1/assistant/ask",
        json={"question": "What is the capital of France?"},
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["answer"] == FALLBACK_MESSAGE
    assert data["sources"] == []


@pytest.mark.asyncio
async def test_assistant_source_metadata_structure(
    client: AsyncClient, db_session
) -> None:
    """Verify source metadata is clean and does not expose vector IDs or raw embeddings."""
    _, headers = await create_test_student(db_session)
    response = await client.post(
        "/api/v1/assistant/ask",
        json={"question": "What percentage of attendance is mandatory?"},
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["sources"]) > 0
    for src in data["sources"]:
        assert "document" in src
        assert isinstance(src["document"], str)
        assert src["document"].endswith(".md")
        # Ensure internal vector internals are NEVER exposed
        assert "embedding" not in src
        assert "vector" not in src
        assert "vector_id" not in src
        assert "id" not in src


@pytest.mark.asyncio
async def test_assistant_llm_failure_handled_gracefully(
    client: AsyncClient, db_session
) -> None:
    """When external LLM call encounters a network error, service handles it safely without crashing."""
    _, headers = await create_test_student(db_session)

    with patch.object(rag_service, "_call_llm", side_effect=RuntimeError("Simulated LLM Timeout")):
        response = await client.post(
            "/api/v1/assistant/ask",
            json={"question": "What is the attendance requirement?"},
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "answer" in data
        assert len(data["answer"]) > 20
        assert "Simulated LLM Timeout" not in data["answer"]  # No internal exception leaks
        assert len(data["sources"]) > 0


@pytest.mark.asyncio
async def test_assistant_mocked_llm_call(
    client: AsyncClient, db_session
) -> None:
    """Verify that when external LLM succeeds, its response is returned with sources."""
    _, headers = await create_test_student(db_session)

    mocked_llm_answer = "Mocked LLM: Students must attend at least 75% of classes."
    with patch.object(rag_service, "_call_llm", new=AsyncMock(return_value=mocked_llm_answer)):
        response = await client.post(
            "/api/v1/assistant/ask",
            json={"question": "What is the attendance requirement?"},
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["answer"] == mocked_llm_answer
        assert len(data["sources"]) > 0
        assert data["sources"][0]["document"] == "attendance_policy.md"
