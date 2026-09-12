"""
CampusOS — Health Endpoint Tests
==================================
Tests for GET /api/v1/health

These tests use FastAPI's test client (httpx) and mock the database/redis
checks to avoid requiring live infrastructure during CI.
"""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
async def client():
    """Async test client for the FastAPI application."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as c:
        yield c


class TestHealthEndpoint:
    """Tests for the /api/v1/health endpoint."""

    async def test_health_check_returns_200(self, client: AsyncClient):
        """Health endpoint should always return HTTP 200."""
        with (
            patch("app.api.v1.endpoints.health.check_database_connection", new_callable=AsyncMock, return_value=True),
            patch("app.api.v1.endpoints.health.check_redis_connection", new_callable=AsyncMock, return_value=True),
        ):
            response = await client.get("/api/v1/health")

        assert response.status_code == 200

    async def test_health_check_ok_when_all_healthy(self, client: AsyncClient):
        """When DB and Redis are reachable, status should be 'ok'."""
        with (
            patch("app.api.v1.endpoints.health.check_database_connection", new_callable=AsyncMock, return_value=True),
            patch("app.api.v1.endpoints.health.check_redis_connection", new_callable=AsyncMock, return_value=True),
        ):
            response = await client.get("/api/v1/health")

        data = response.json()
        assert data["status"] == "ok"
        assert data["dependencies"]["database"] == "ok"
        assert data["dependencies"]["cache"] == "ok"

    async def test_health_check_degraded_when_db_down(self, client: AsyncClient):
        """When DB is unreachable, status should be 'degraded'."""
        with (
            patch("app.api.v1.endpoints.health.check_database_connection", new_callable=AsyncMock, return_value=False),
            patch("app.api.v1.endpoints.health.check_redis_connection", new_callable=AsyncMock, return_value=True),
        ):
            response = await client.get("/api/v1/health")

        data = response.json()
        assert data["status"] == "degraded"
        assert data["dependencies"]["database"] == "unreachable"
        assert data["dependencies"]["cache"] == "ok"

    async def test_health_check_degraded_when_redis_down(self, client: AsyncClient):
        """When Redis is unreachable, status should be 'degraded'."""
        with (
            patch("app.api.v1.endpoints.health.check_database_connection", new_callable=AsyncMock, return_value=True),
            patch("app.api.v1.endpoints.health.check_redis_connection", new_callable=AsyncMock, return_value=False),
        ):
            response = await client.get("/api/v1/health")

        data = response.json()
        assert data["status"] == "degraded"
        assert data["dependencies"]["cache"] == "unreachable"

    async def test_health_response_has_required_fields(self, client: AsyncClient):
        """Health response must include all expected fields."""
        with (
            patch("app.api.v1.endpoints.health.check_database_connection", new_callable=AsyncMock, return_value=True),
            patch("app.api.v1.endpoints.health.check_redis_connection", new_callable=AsyncMock, return_value=True),
        ):
            response = await client.get("/api/v1/health")

        data = response.json()
        assert "status" in data
        assert "app" in data
        assert "version" in data
        assert "uptime_seconds" in data
        assert "dependencies" in data
        assert data["app"] == "CampusOS"

    async def test_root_endpoint(self, client: AsyncClient):
        """Root / should return a welcome message."""
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "health" in data
