"""
CampusOS — Redis Client
========================
Creates and manages an async Redis connection pool.

Usage:

    from app.core.redis import get_redis_client

    redis = await get_redis_client()
    await redis.set("key", "value", ex=60)
    value = await redis.get("key")

Future uses:
- Response caching
- Rate limiting
- Celery broker (via redis://)
- Background job results
- Temporary session data
"""
from __future__ import annotations

import logging

import redis.asyncio as aioredis
from redis.asyncio import Redis
from redis.exceptions import ConnectionError as RedisConnectionError

from app.core.config import settings

logger = logging.getLogger(__name__)

# =============================================================================
# Connection Pool (module-level singleton)
# =============================================================================

_redis_client: Redis | None = None


def _build_redis_client() -> Redis:
    """Construct a new async Redis client from application settings."""
    return aioredis.from_url(
        settings.redis_url,  # type: ignore[arg-type]
        encoding="utf-8",
        decode_responses=True,
        socket_connect_timeout=5,
        socket_timeout=5,
        retry_on_timeout=True,
        health_check_interval=30,
    )


async def get_redis_client() -> Redis:
    """Return the singleton async Redis client, creating it on first call."""
    global _redis_client
    if _redis_client is None:
        _redis_client = _build_redis_client()
    return _redis_client


async def check_redis_connection() -> bool:
    """Verify that Redis is reachable. Used by the health endpoint."""
    try:
        client = await get_redis_client()
        return await client.ping()
    except (RedisConnectionError, Exception) as exc:
        logger.error("Redis connectivity check failed: %s", exc)
        return False


async def close_redis_client() -> None:
    """Close the Redis connection pool. Call on application shutdown."""
    global _redis_client
    if _redis_client is not None:
        await _redis_client.aclose()
        _redis_client = None
        logger.info("Redis client closed.")
