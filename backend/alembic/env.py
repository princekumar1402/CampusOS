"""
Alembic Environment Configuration for CampusOS
================================================
Reads database connection settings from Pydantic Settings (app.core.config)
so that the same .env file controls both the application and migrations.

Usage:

    # Create a new migration (autogenerate from model changes):
    cd backend
    alembic revision --autogenerate -m "add users table"

    # Apply all pending migrations:
    alembic upgrade head

    # Downgrade one step:
    alembic downgrade -1

    # Show current migration state:
    alembic current
"""
from __future__ import annotations

import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

# ---------------------------------------------------------------------------
# Add the backend/ directory to sys.path so that `app` is importable
# ---------------------------------------------------------------------------
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# ---------------------------------------------------------------------------
# Import application settings and the declarative Base
# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# Import all models so that Alembic autogenerate can detect them.
# As new domain models are added, import them here.
# ---------------------------------------------------------------------------
import app.models  # noqa: F401 — ensures all models are registered on Base
from app.core.config import settings
from app.core.database import Base

# ---------------------------------------------------------------------------
# Alembic Config object (gives access to alembic.ini values)
# ---------------------------------------------------------------------------
config = context.config

# Override the sqlalchemy.url from app settings (uses sync driver for Alembic)
config.set_main_option("sqlalchemy.url", settings.sync_database_url)

# Set up Python logging from the alembic.ini [loggers] section
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Metadata used for autogenerate
target_metadata = Base.metadata


# ---------------------------------------------------------------------------
# Migration runners
# ---------------------------------------------------------------------------


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (without a live DB connection).

    Generates SQL scripts that can be applied manually.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode (with a live DB connection)."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
