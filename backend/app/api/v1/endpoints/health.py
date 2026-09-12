"""CampusOS — Health check endpoint."""
from __future__ import annotations

import time
from typing import Any

from fastapi import APIRouter

from app.core.database import check_database_connection
from app.core.redis import check_redis_connection

router = APIRouter(tags=["Health"])

_START_TIME = time.time()


@router.get(
    "/health",
    summary="Application health check",
    description=(
        "Returns the overall health of the CampusOS API. "
        "Includes liveness status and readiness checks for PostgreSQL and Redis."
    ),
    response_description="Health status object",
)
async def health_check() -> dict[str, Any]:
    """Liveness + readiness health check.

    - **status**: ``ok`` when all dependencies are healthy, ``degraded`` otherwise.
    - **database**: PostgreSQL reachability.
    - **cache**: Redis reachability.
    - **uptime_seconds**: seconds since the API process started.
    """
    db_ok = await check_database_connection()
    redis_ok = await check_redis_connection()

    overall = "ok" if (db_ok and redis_ok) else "degraded"
    uptime = round(time.time() - _START_TIME, 2)

    return {
        "status": overall,
        "app": "CampusOS",
        "version": "0.1.0",
        "uptime_seconds": uptime,
        "dependencies": {
            "database": "ok" if db_ok else "unreachable",
            "cache": "ok" if redis_ok else "unreachable",
        },
    }
