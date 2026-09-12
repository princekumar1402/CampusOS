"""
CampusOS — Models Package
==========================
Import all SQLAlchemy ORM models here so Alembic autogenerate detects them.
"""
from app.models.user import RefreshToken, User, UserRole

__all__ = ["User", "RefreshToken", "UserRole"]
