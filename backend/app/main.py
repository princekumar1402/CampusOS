"""
CampusOS — FastAPI Application Entry Point
==========================================
Creates and configures the FastAPI application instance.

Run locally (from backend/ directory):

    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"""
from __future__ import annotations

import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse

from app.api.v1.router import router as v1_router
from app.core.config import settings
from app.core.database import dispose_engine
from app.core.errors import register_error_handlers
from app.core.logging import configure_logging
from app.core.redis import close_redis_client

logger = logging.getLogger(__name__)


# =============================================================================
# Lifespan — startup / shutdown
# =============================================================================


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage application startup and shutdown lifecycle."""

    # ----- Startup -----
    configure_logging()
    logger.info("🚀 CampusOS API starting up (env=%s)", settings.app_env)
    logger.info("API prefix: %s", settings.api_v1_prefix)

    yield  # Application is running

    # ----- Shutdown -----
    logger.info("🛑 CampusOS API shutting down …")
    await dispose_engine()
    await close_redis_client()
    logger.info("Shutdown complete.")


# =============================================================================
# Application Factory
# =============================================================================


def create_application() -> FastAPI:
    """Construct and configure the FastAPI application."""

    app = FastAPI(
        title="CampusOS API",
        description=(
            "**CampusOS** — Unified Digital Campus Platform\n\n"
            "A production-grade modular monolith managing academics, campus services, "
            "career tools, and AI-powered features for universities.\n\n"
            "_This API is versioned under `/api/v1/`._"
        ),
        version=settings.app_version,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        default_response_class=ORJSONResponse,
        lifespan=lifespan,
    )

    # ------------------------------------------------------------------
    # Middleware
    # ------------------------------------------------------------------
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ------------------------------------------------------------------
    # Exception Handlers
    # ------------------------------------------------------------------
    register_error_handlers(app)

    # ------------------------------------------------------------------
    # Routers
    # ------------------------------------------------------------------
    app.include_router(v1_router, prefix=settings.api_v1_prefix)

    # ------------------------------------------------------------------
    # Root redirect
    # ------------------------------------------------------------------
    @app.get("/", include_in_schema=False)
    async def root() -> dict[str, str]:
        return {
            "message": "Welcome to CampusOS API",
            "docs": "/docs",
            "health": f"{settings.api_v1_prefix}/health",
        }

    return app


# =============================================================================
# App instance (used by uvicorn)
# =============================================================================

app: FastAPI = create_application()
