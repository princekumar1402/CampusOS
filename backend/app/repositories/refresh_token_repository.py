"""
CampusOS — Refresh Token Repository
===================================
Database operations for persistent refresh token sessions.
"""
from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import RefreshToken


class RefreshTokenRepository:
    """Repository handling database storage and revocation of refresh tokens."""

    async def create_session(
        self,
        db: AsyncSession,
        *,
        user_id: uuid.UUID,
        token_hash: str,
        expires_at: datetime,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> RefreshToken:
        """Create and store a refresh token session record."""
        session_record = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
            user_agent=user_agent[:500] if user_agent else None,
            ip_address=ip_address[:45] if ip_address else None,
        )
        db.add(session_record)
        await db.flush()
        return session_record

    async def get_by_token_hash(self, db: AsyncSession, token_hash: str) -> RefreshToken | None:
        """Retrieve a refresh token record by token hash."""
        stmt = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def revoke_by_token_hash(self, db: AsyncSession, token_hash: str) -> None:
        """Revoke a single refresh token by its hash."""
        now = datetime.now(UTC)
        stmt = (
            update(RefreshToken)
            .where(RefreshToken.token_hash == token_hash, RefreshToken.revoked_at.is_(None))
            .values(revoked_at=now)
        )
        await db.execute(stmt)

    async def revoke_all_for_user(self, db: AsyncSession, user_id: uuid.UUID) -> None:
        """Revoke all active refresh tokens for a specified user (multi-device logout)."""
        now = datetime.now(UTC)
        stmt = (
            update(RefreshToken)
            .where(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
            .values(revoked_at=now)
        )
        await db.execute(stmt)


refresh_token_repository = RefreshTokenRepository()
