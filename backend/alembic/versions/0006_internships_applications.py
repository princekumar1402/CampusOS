"""create internships and internship_applications tables and add skills to student_profiles

Revision ID: 0006_internships_applications
Revises: 0005_complaints_notifications
Create Date: 2026-09-21 00:30:00.000000

"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0006_internships_applications"
down_revision: str | None = "0005_complaints_notifications"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Add skills column to student_profiles
    op.add_column(
        "student_profiles",
        sa.Column("skills", sa.Text(), nullable=True, server_default=""),
    )

    # 2. Create internships table
    op.create_table(
        "internships",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("company", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("required_skills", sa.Text(), nullable=False),
        sa.Column("location", sa.String(length=255), nullable=False),
        sa.Column("mode", sa.String(length=50), nullable=False, server_default="Remote"),
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
    op.create_index(
        "ix_internships_created_by",
        "internships",
        ["created_by"],
    )

    # 3. Create internship_applications table
    op.create_table(
        "internship_applications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "internship_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("internships.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "student_profile_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("student_profiles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="APPLIED"),
        sa.Column(
            "applied_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.UniqueConstraint("internship_id", "student_profile_id", name="uq_internship_student_application"),
    )
    op.create_index(
        "ix_internship_applications_internship_id",
        "internship_applications",
        ["internship_id"],
    )
    op.create_index(
        "ix_internship_applications_student_profile_id",
        "internship_applications",
        ["student_profile_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_internship_applications_student_profile_id", table_name="internship_applications")
    op.drop_index("ix_internship_applications_internship_id", table_name="internship_applications")
    op.drop_table("internship_applications")

    op.drop_index("ix_internships_created_by", table_name="internships")
    op.drop_table("internships")

    op.drop_column("student_profiles", "skills")
