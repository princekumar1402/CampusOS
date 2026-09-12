"""CampusOS — Models package.

SQLAlchemy ORM models will be placed here, organized by domain module.

Example structure (added in later phases):
    models/
        user.py          ← Authentication / RBAC
        student.py       ← Student profiles
        faculty.py       ← Faculty profiles
        course.py        ← Course catalogue
        enrollment.py    ← Student-course enrollments
        attendance.py    ← Attendance records
        event.py         ← Campus events
        complaint.py     ← CampusFix complaints
        internship.py    ← Internship listings
        ...

All models must inherit from app.core.database.Base.
"""
# Import all model modules here so Alembic's autogenerate can detect them.
# Example: from app.models.user import User  # noqa: F401
