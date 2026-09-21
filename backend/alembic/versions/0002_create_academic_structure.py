"""create departments, student_profiles, and faculty_profiles tables

Revision ID: 0002_academic
Revises: 0001_auth_rbac
Create Date: 2026-09-13 18:55:00.000000

"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0002_academic"
down_revision: str | None = "0001_auth_rbac"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. Create departments table
    op.create_table(
        "departments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(length=20), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
    )
    op.create_index(op.f("ix_departments_code"), "departments", ["code"], unique=True)

    # 2. Create student_profiles table
    op.create_table(
        "student_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("student_id", sa.String(length=50), nullable=False),
        sa.Column("department_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("departments.id", ondelete="SET NULL"), nullable=True),
        sa.Column("program", sa.String(length=100), nullable=False, server_default="B.Tech Computer Science"),
        sa.Column("batch_year", sa.Integer(), nullable=False, server_default="2026"),
        sa.Column("cgpa", sa.Float(), nullable=True),
        sa.Column("phone_number", sa.String(length=20), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
    )
    op.create_index(op.f("ix_student_profiles_user_id"), "student_profiles", ["user_id"], unique=True)
    op.create_index(op.f("ix_student_profiles_student_id"), "student_profiles", ["student_id"], unique=True)
    op.create_index(op.f("ix_student_profiles_department_id"), "student_profiles", ["department_id"], unique=False)

    # 3. Create faculty_profiles table
    op.create_table(
        "faculty_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("employee_id", sa.String(length=50), nullable=False),
        sa.Column("department_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("departments.id", ondelete="SET NULL"), nullable=True),
        sa.Column("designation", sa.String(length=100), nullable=False, server_default="Assistant Professor"),
        sa.Column("specialization", sa.String(length=255), nullable=True),
        sa.Column("office_location", sa.String(length=100), nullable=True),
        sa.Column("phone_number", sa.String(length=20), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
    )
    op.create_index(op.f("ix_faculty_profiles_user_id"), "faculty_profiles", ["user_id"], unique=True)
    op.create_index(op.f("ix_faculty_profiles_employee_id"), "faculty_profiles", ["employee_id"], unique=True)
    op.create_index(op.f("ix_faculty_profiles_department_id"), "faculty_profiles", ["department_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_faculty_profiles_department_id"), table_name="faculty_profiles")
    op.drop_index(op.f("ix_faculty_profiles_employee_id"), table_name="faculty_profiles")
    op.drop_index(op.f("ix_faculty_profiles_user_id"), table_name="faculty_profiles")
    op.drop_table("faculty_profiles")

    op.drop_index(op.f("ix_student_profiles_department_id"), table_name="student_profiles")
    op.drop_index(op.f("ix_student_profiles_student_id"), table_name="student_profiles")
    op.drop_index(op.f("ix_student_profiles_user_id"), table_name="student_profiles")
    op.drop_table("student_profiles")

    op.drop_index(op.f("ix_departments_code"), table_name="departments")
    op.drop_table("departments")
