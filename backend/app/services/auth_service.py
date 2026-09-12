"""
CampusOS — Authentication Service
=================================
Core business logic for user registration, authentication, token issuing, session refresh, and logout.
"""
from __future__ import annotations

import logging
from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.errors import ConflictError, UnauthorizedError
from app.core.security import (
    create_access_token,
    generate_raw_refresh_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.models.user import User, UserRole
from app.repositories.refresh_token_repository import refresh_token_repository
from app.repositories.user_repository import user_repository
from app.schemas.auth import TokenResponse, UserRegisterRequest, UserResponse

logger = logging.getLogger(__name__)


class AuthService:
    """Service handling all authentication workflows."""

    async def register(self, db: AsyncSession, register_in: UserRegisterRequest) -> User:
        """Register a new user account with default STUDENT role.

        SECURITY GUARANTEE:
        Public registration ALWAYS creates a STUDENT. Privileged roles (ADMIN, FACULTY, CLUB_ADMIN)
        cannot be assigned through public registration endpoints.
        """
        normalized_email = register_in.email.strip().lower()

        # Check duplicate email
        existing_user = await user_repository.get_by_email(db, normalized_email)
        if existing_user:
            raise ConflictError("A user with this email address already exists.")

        # Hash password securely using Argon2id
        hashed = hash_password(register_in.password)

        # Create user with STUDENT safe default role
        user = await user_repository.create(
            db,
            full_name=register_in.full_name,
            email=normalized_email,
            password_hash=hashed,
            role=UserRole.STUDENT,
        )
        logger.info("New user registered successfully: id=%s, email=%s", user.id, user.email)
        return user

    async def authenticate(self, db: AsyncSession, email: str, password: str) -> User:
        """Authenticate user credentials and return the user record.

        Uses generic error messages to prevent user enumeration.
        """
        normalized_email = email.strip().lower()
        user = await user_repository.get_by_email(db, normalized_email)

        # Generic failure message to prevent email enumeration
        invalid_creds_error = UnauthorizedError("Invalid email or password.")

        if not user:
            # Perform dummy hash verification to mitigate timing attacks
            hash_password("dummy_password_for_timing_mitigation_123!")
            raise invalid_creds_error

        if not verify_password(password, user.password_hash):
            raise invalid_creds_error

        if not user.is_active:
            raise UnauthorizedError("User account is inactive. Please contact system support.")

        # Update last login timestamp
        await user_repository.update_last_login(db, user.id)
        return user

    async def create_tokens_for_user(
        self,
        db: AsyncSession,
        user: User,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> tuple[TokenResponse, str]:
        """Create access token and a persistent refresh token session.

        :return: Tuple of (TokenResponse schema, raw_refresh_token_string)
        """
        # Create JWT access token
        access_token = create_access_token(
            subject=str(user.id),
            role=user.role.value,
        )

        # Generate cryptographic raw refresh token
        raw_refresh_token = generate_raw_refresh_token()
        token_hash = hash_token(raw_refresh_token)

        # Calculate expiration
        expires_at = datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days)

        # Store session record in DB
        await refresh_token_repository.create_session(
            db,
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
            user_agent=user_agent,
            ip_address=ip_address,
        )

        token_response = TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=settings.access_token_expire_minutes * 60,
            user=UserResponse.model_validate(user),
        )

        return token_response, raw_refresh_token

    async def refresh_tokens(
        self,
        db: AsyncSession,
        raw_refresh_token: str,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> tuple[TokenResponse, str]:
        """Validate an active refresh token, rotate it, and return a new token pair."""
        if not raw_refresh_token or not raw_refresh_token.strip():
            raise UnauthorizedError("Refresh token is required.")

        token_hash = hash_token(raw_refresh_token)
        token_record = await refresh_token_repository.get_by_token_hash(db, token_hash)

        if not token_record:
            raise UnauthorizedError("Invalid or expired refresh token.")

        if not token_record.is_active:
            raise UnauthorizedError("Refresh token has been revoked or expired.")

        user = await user_repository.get_by_id(db, token_record.user_id)
        if not user or not user.is_active:
            raise UnauthorizedError("User account is inactive or no longer exists.")

        # ROTATION: Revoke previous token session
        await refresh_token_repository.revoke_by_token_hash(db, token_hash)

        # Issue new token pair
        return await self.create_tokens_for_user(db, user, user_agent=user_agent, ip_address=ip_address)

    async def logout(self, db: AsyncSession, raw_refresh_token: str | None) -> None:
        """Revoke the refresh token session associated with logout."""
        if not raw_refresh_token:
            return
        token_hash = hash_token(raw_refresh_token)
        await refresh_token_repository.revoke_by_token_hash(db, token_hash)


auth_service = AuthService()
