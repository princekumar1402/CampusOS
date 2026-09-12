"""
CampusOS — Database Engine & Session Factory
=============================================
Sets up an async SQLAlchemy engine and session factory backed by PostgreSQL.

Usage in endpoint handlers (via FastAPI dependency injection):

    async def my_endpoint(db: AsyncSession = Depends(get_db)):
        result = await db.execute(...)

The session is committed/rolled back/closed automatically by the dependency.
"""
from __future__ import annotations

import logging
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

logger = logging.getLogger(__name__)

# =============================================================================
# Engine
# =============================================================================

engine: AsyncEngine = create_async_engine(
    settings.database_url,  # type: ignore[arg-type]
    echo=settings.debug,
    pool_pre_ping=True,       # verify connections before use
    pool_size=10,
    max_overflow=20,
    pool_recycle=3600,        # recycle connections after 1 hour
)

# =============================================================================
# Session Factory
# =============================================================================

AsyncSessionLocal: async_sessionmaker[AsyncSession] = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,   # avoid lazy-load errors after commit
    autocommit=False,
    autoflush=False,
)

# =============================================================================
# Declarative Base — all domain models inherit from this
# =============================================================================


class Base(DeclarativeBase):
    """SQLAlchemy declarative base for all CampusOS ORM models."""
    pass


# =============================================================================
# Dependency
# =============================================================================


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields a transactional async database session.

    Automatically rolls back on error and closes the session on exit.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# =============================================================================
# Startup / Shutdown helpers
# =============================================================================


async def check_database_connection() -> bool:
    """Verify that the database is reachable. Used by the health endpoint."""
    from sqlalchemy import text

    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception as exc:
        logger.error("Database connectivity check failed: %s", exc)
        return False


async def dispose_engine() -> None:
    """Dispose the connection pool. Call on application shutdown."""
    await engine.dispose()
    logger.info("Database engine disposed.")
