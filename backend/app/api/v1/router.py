"""CampusOS — API v1 router."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.endpoints import (
    applications,
    assistant,
    attendance,
    auth,
    clubs,
    complaints,
    courses,
    departments,
    events,
    faculty,
    health,
    internships,
    notifications,
    students,
)

router = APIRouter()

# ---------------------------------------------------------------------------
# Mount sub-routers
# ---------------------------------------------------------------------------
router.include_router(health.router)
router.include_router(auth.router)
router.include_router(departments.router)
router.include_router(students.router)
router.include_router(faculty.router)
router.include_router(courses.router)
router.include_router(attendance.router)
router.include_router(events.router)
router.include_router(clubs.router)
router.include_router(complaints.router)
router.include_router(notifications.router)
router.include_router(internships.router)
router.include_router(applications.router)
router.include_router(assistant.router)


# Future domain routers will be added here, for example:
# router.include_router(auth.router,        prefix="/auth",        tags=["Authentication"])
# router.include_router(students.router,    prefix="/students",    tags=["Students"])
# router.include_router(faculty.router,     prefix="/faculty",     tags=["Faculty"])
# router.include_router(courses.router,     prefix="/courses",     tags=["Courses"])
# router.include_router(attendance.router,  prefix="/attendance",  tags=["Attendance"])
# router.include_router(events.router,      prefix="/events",      tags=["Events"])
# router.include_router(complaints.router,  prefix="/complaints",  tags=["CampusFix"])
# router.include_router(internships.router, prefix="/internships", tags=["Internships"])
# router.include_router(ai.router,          prefix="/ai",          tags=["AI Assistant"])
