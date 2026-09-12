"""CampusOS — API v1 router."""
from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.endpoints import health

router = APIRouter()

# ---------------------------------------------------------------------------
# Mount sub-routers
# ---------------------------------------------------------------------------
router.include_router(health.router)

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
