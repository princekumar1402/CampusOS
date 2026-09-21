"""create complaints and notifications tables

Revision ID: 0005_complaints_notifications
Revises: 0004_events_clubs
Create Date: 2026-09-20 23:50:00.000000

"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0005_complaints_notifications"
down_revision: str | None = "0004_events_clubs"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Create complaint status enum
    complaint_status_enum = postgresql.ENUM(
        "OPEN", "IN_PROGRESS", "RESOLVED",
        name="complaint_status_enum",
        create_type=False,
    )
    complaint_status_enum.create(op.get_bind(), checkfirst=True)

    # 2. Create complaints table
    op.create_table(
        "complaints",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("location", sa.String(length=255), nullable=False),
        sa.Column("status", complaint_status_enum, nullable=False, server_default="OPEN"),
        sa.Column(
            "created_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    # 3. Create notifications table
    op.create_table(
        "notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("message", sa.String(length=500), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("complaints")
    complaint_status_enum = postgresql.ENUM(
        "OPEN", "IN_PROGRESS", "RESOLVED",
        name="complaint_status_enum",
        create_type=False,
    )
    complaint_status_enum.drop(op.get_bind(), checkfirst=True)
