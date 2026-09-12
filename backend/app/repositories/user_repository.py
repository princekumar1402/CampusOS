"""
CampusOS — User Repository
==========================
Database operations for User entities.
"""
from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole


class UserRepository:
    """Repository handling database operations for User records."""

    async def get_by_id(self, db: AsyncSession, user_id: uuid.UUID) -> User | None:
        """Fetch user by primary key ID."""
        stmt = select(User).where(User.id == user_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_email(self, db: AsyncSession, email: str) -> User | None:
        """Fetch user by normalized email address."""
        normalized_email = email.strip().lower()
        stmt = select(User).where(User.email == normalized_email)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def create(
        self,
        db: AsyncSession,
        *,
        full_name: str,
        email: str,
        password_hash: str,
        role: UserRole = UserRole.STUDENT,
        is_active: bool = True,
        is_verified: bool = False,
    ) -> User:
        """Create and persist a new User record."""
        user = User(
            full_name=full_name.strip(),
            email=email.strip().lower(),
            password_hash=password_hash,
            role=role,
            is_active=is_active,
            is_verified=is_verified,
        )
        db.add(user)
        await db.flush()  # Populates user.id without committing
        return user

    async def update_last_login(self, db: AsyncSession, user_id: uuid.UUID) -> None:
        """Update last_login_at timestamp for a user."""
        now = datetime.now(UTC)
        stmt = update(User).where(User.id == user_id).values(last_login_at=now, updated_at=now)
        await db.execute(stmt)


user_repository = UserRepository()
