"""
CampusOS — Core Configuration
==============================
All application settings are loaded from environment variables via
Pydantic Settings. Never hardcode secrets — use .env.example as a reference
and copy it to .env for local development.
"""
from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application-wide configuration driven by environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # -------------------------------------------------------------------------
    # Application
    # -------------------------------------------------------------------------
    app_name: str = "CampusOS"
    app_version: str = "0.1.0"
    app_env: Literal["development", "staging", "production"] = "development"
    debug: bool = False

    # -------------------------------------------------------------------------
    # API
    # -------------------------------------------------------------------------
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    api_v1_prefix: str = "/api/v1"

    # -------------------------------------------------------------------------
    # Security & JWT
    # -------------------------------------------------------------------------
    secret_key: str = "CHANGE_ME_GENERATE_A_STRONG_SECRET_KEY"
    jwt_secret_key: str = "CHANGE_ME_GENERATE_A_STRONG_JWT_SECRET_KEY_MIN_32_BYTES"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    cors_origins: list[str] = ["http://localhost:3000"]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    # -------------------------------------------------------------------------
    # PostgreSQL
    # -------------------------------------------------------------------------
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "campusOS_db"
    postgres_user: str = "campusOS_user"
    postgres_password: str = "devpassword"

    # Assembled DATABASE_URL — can be overridden directly via env var
    database_url: str | None = None

    @model_validator(mode="after")
    def assemble_database_url(self) -> Settings:
        if not self.database_url:
            self.database_url = (
                f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
                f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
            )
        return self

    # Sync URL for Alembic (uses psycopg2 / standard driver)
    @property
    def sync_database_url(self) -> str:
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    # -------------------------------------------------------------------------
    # Redis
    # -------------------------------------------------------------------------
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_password: str = "devredispassword"
    redis_db: int = 0
    redis_url: str | None = None

    @model_validator(mode="after")
    def assemble_redis_url(self) -> Settings:
        if not self.redis_url:
            self.redis_url = (
                f"redis://:{self.redis_password}@{self.redis_host}:{self.redis_port}/{self.redis_db}"
            )
        return self

    # -------------------------------------------------------------------------
    # Workers (Celery) — wired up in a later module
    # -------------------------------------------------------------------------
    celery_broker_url: str | None = None
    celery_result_backend: str | None = None

    # -------------------------------------------------------------------------
    # AI / LLM — wired up in a later module
    # -------------------------------------------------------------------------
    openai_api_key: str | None = None

    # -------------------------------------------------------------------------
    # Helpers
    # -------------------------------------------------------------------------
    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def is_development(self) -> bool:
        return self.app_env == "development"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached singleton Settings instance."""
    return Settings()


# Module-level shortcut — use `from app.core.config import settings`
settings: Settings = get_settings()
