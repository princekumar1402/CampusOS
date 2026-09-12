"""
CampusOS — Cryptographic & Token Security Utilities
===================================================
Provides password hashing (Argon2id), password verification, JWT access token creation/decoding,
and secure refresh token hashing (SHA-256).
"""
from __future__ import annotations

import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

from app.core.config import settings
from app.core.errors import UnauthorizedError, ValidationError

# Argon2id password hasher instance
_ph = PasswordHasher()


# =============================================================================
# Password Hashing & Verification
# =============================================================================


def hash_password(password: str) -> str:
    """Hash a plaintext password using Argon2id."""
    validate_password_strength(password)
    return _ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against an Argon2id hash."""
    try:
        return _ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def validate_password_strength(password: str) -> None:
    """Validate basic password strength requirements.

    Requirements:
    - Minimum 8 characters
    - Cannot be blank or only whitespace
    """
    if not password or not password.strip():
        raise ValidationError("Password cannot be empty.")
    if len(password) < 8:
        raise ValidationError("Password must be at least 8 characters long.")


# =============================================================================
# JWT Access Token Utilities
# =============================================================================


def create_access_token(
    subject: str,
    role: str,
    extra_claims: dict[str, Any] | None = None,
    expires_delta: timedelta | None = None,
) -> str:
    """Create a signed JWT access token.

    :param subject: User ID (UUID string)
    :param role: User role string (e.g. 'STUDENT', 'ADMIN')
    :param extra_claims: Optional dictionary of additional claims
    :param expires_delta: Token lifespan override
    """
    now = datetime.now(UTC)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.access_token_expire_minutes)

    to_encode: dict[str, Any] = {
        "sub": str(subject),
        "role": role,
        "iat": now,
        "exp": expire,
        "type": "access",
    }
    if extra_claims:
        to_encode.update(extra_claims)

    encoded_jwt = jwt.encode(
        to_encode,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )
    return encoded_jwt


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT access token.

    :raises UnauthorizedError: If token is expired, invalid, or missing required claims.
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        if payload.get("type") != "access":
            raise UnauthorizedError("Invalid token type.")
        if "sub" not in payload or "role" not in payload:
            raise UnauthorizedError("Invalid token claims.")
        return payload
    except jwt.ExpiredSignatureError as exc:
        raise UnauthorizedError("Access token has expired.") from exc
    except jwt.InvalidTokenError as exc:
        raise UnauthorizedError("Could not validate access token.") from exc


# =============================================================================
# Refresh Token Utilities
# =============================================================================


def generate_raw_refresh_token() -> str:
    """Generate a cryptographically secure random refresh token string."""
    return secrets.token_urlsafe(64)


def hash_token(token: str) -> str:
    """Hash a token string using SHA-256 for persistent database storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
