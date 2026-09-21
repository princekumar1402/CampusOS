"""create events, event_registrations, clubs, club_memberships tables

Revision ID: 0004_events_clubs
Revises: 0003_attendance_mvp
Create Date: 2026-09-20 23:30:00.000000

"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0004_events_clubs"
down_revision: str | None = "0003_attendance_mvp"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Create events table
    op.create_table(
        "events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("date_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("location", sa.String(length=255), nullable=False),
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
    )

    # 2. Create event_registrations table
    op.create_table(
        "event_registrations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "event_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("events.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "student_profile_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("student_profiles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "registered_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.UniqueConstraint("event_id", "student_profile_id", name="uq_event_student"),
    )

    # 3. Create clubs table
    op.create_table(
        "clubs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.UniqueConstraint("name", name="uq_clubs_name"),
    )

    # 4. Create club_memberships table
    op.create_table(
        "club_memberships",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "club_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("clubs.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "student_profile_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("student_profiles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "joined_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.UniqueConstraint("club_id", "student_profile_id", name="uq_club_student"),
    )


def downgrade() -> None:
    op.drop_table("club_memberships")
    op.drop_table("clubs")
    op.drop_table("event_registrations")
    op.drop_table("events")
