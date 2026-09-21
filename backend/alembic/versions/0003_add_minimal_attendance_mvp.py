"""create courses and attendance_records tables

Revision ID: 0003_attendance_mvp
Revises: 0002_academic
Create Date: 2026-09-15 13:25:00.000000

"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0003_attendance_mvp"
down_revision: str | None = "0002_academic"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Create attendance status enum
    attendance_status_enum = postgresql.ENUM(
        "PRESENT", "ABSENT",
        name="attendance_status_enum",
        create_type=False,
    )
    attendance_status_enum.create(op.get_bind(), checkfirst=True)

    # 2. Create courses table
    op.create_table(
        "courses",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(length=20), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("department_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("departments.id", ondelete="SET NULL"), nullable=True),
        sa.Column("faculty_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("faculty_profiles.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
    )
    op.create_index(op.f("ix_courses_code"), "courses", ["code"], unique=True)
    op.create_index(op.f("ix_courses_department_id"), "courses", ["department_id"], unique=False)
    op.create_index(op.f("ix_courses_faculty_id"), "courses", ["faculty_id"], unique=False)

    # 3. Create attendance_records table
    op.create_table(
        "attendance_records",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("course_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("courses.id", ondelete="CASCADE"), nullable=False),
        sa.Column("student_profile_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("status", attendance_status_enum, nullable=False, server_default="PRESENT"),
        sa.Column("remarks", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.UniqueConstraint("course_id", "student_profile_id", "date", name="uq_course_student_date"),
    )
    op.create_index(op.f("ix_attendance_records_course_id"), "attendance_records", ["course_id"], unique=False)
    op.create_index(op.f("ix_attendance_records_student_profile_id"), "attendance_records", ["student_profile_id"], unique=False)
    op.create_index(op.f("ix_attendance_records_date"), "attendance_records", ["date"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_attendance_records_date"), table_name="attendance_records")
    op.drop_index(op.f("ix_attendance_records_student_profile_id"), table_name="attendance_records")
    op.drop_index(op.f("ix_attendance_records_course_id"), table_name="attendance_records")
    op.drop_table("attendance_records")

    op.drop_index(op.f("ix_courses_faculty_id"), table_name="courses")
    op.drop_index(op.f("ix_courses_department_id"), table_name="courses")
    op.drop_index(op.f("ix_courses_code"), table_name="courses")
    op.drop_table("courses")

    attendance_status_enum = postgresql.ENUM("PRESENT", "ABSENT", name="attendance_status_enum")
    attendance_status_enum.drop(op.get_bind(), checkfirst=True)
