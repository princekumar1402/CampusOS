"""
CampusOS — Models Package
==========================
Import all SQLAlchemy ORM models here so Alembic autogenerate detects them.
"""
from app.models.academic import Department, FacultyProfile, StudentProfile
from app.models.attendance import AttendanceRecord, AttendanceStatus, Course
from app.models.complaint_notification import Complaint, ComplaintStatus, Notification
from app.models.events_clubs import Club, ClubMembership, Event, EventRegistration
from app.models.internship import Internship, InternshipApplication
from app.models.user import RefreshToken, User, UserRole

__all__ = [
    "User",
    "RefreshToken",
    "UserRole",
    "Department",
    "StudentProfile",
    "FacultyProfile",
    "Course",
    "AttendanceRecord",
    "AttendanceStatus",
    "Event",
    "EventRegistration",
    "Club",
    "ClubMembership",
    "Complaint",
    "ComplaintStatus",
    "Notification",
    "Internship",
    "InternshipApplication",
]

