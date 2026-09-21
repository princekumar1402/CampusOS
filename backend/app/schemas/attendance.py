"""
CampusOS — Course & Attendance Pydantic Schemas
===============================================
Schemas for Course management and Attendance MVP endpoints.
"""
from __future__ import annotations

from datetime import date as date_type, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.attendance import AttendanceStatus
from app.schemas.academic import DepartmentResponse, FacultyProfileResponse

# =============================================================================
# Course Schemas
# =============================================================================


class CourseBase(BaseModel):
    """Base course properties."""

    code: str = Field(..., min_length=2, max_length=20, description="Course code (e.g. CS101)")
    name: str = Field(..., min_length=2, max_length=255, description="Full course title")
    department_id: UUID | None = Field(None, description="Associated department ID")
    faculty_id: UUID | None = Field(None, description="Assigned faculty profile ID")


class CourseCreate(CourseBase):
    """Payload for creating a new course."""

    pass


class CourseResponse(CourseBase):
    """Course output model."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime

    department: DepartmentResponse | None = None
    faculty: FacultyProfileResponse | None = None


# =============================================================================
# Attendance Schemas
# =============================================================================


class AttendanceMarkItem(BaseModel):
    """Individual student attendance mark item."""

    student_profile_id: UUID = Field(..., description="Student profile UUID")
    status: AttendanceStatus = Field(default=AttendanceStatus.PRESENT, description="PRESENT or ABSENT")
    remarks: str | None = Field(None, max_length=255)


class AttendanceBatchCreate(BaseModel):
    """Payload for batch marking attendance for a class session."""

    course_id: UUID = Field(..., description="Course UUID")
    date: date_type = Field(..., description="Attendance date (YYYY-MM-DD)")
    records: list[AttendanceMarkItem] = Field(..., min_items=1, description="List of student marks")


class AttendanceRecordResponse(BaseModel):
    """Single attendance record output model."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    course_id: UUID
    student_profile_id: UUID
    date: date_type
    status: AttendanceStatus
    remarks: str | None = None
    created_at: datetime
    updated_at: datetime

    course: CourseResponse | None = None



from enum import Enum

# =============================================================================
# Attendance Threshold & Intelligence Constants
# =============================================================================

ATTENDANCE_THRESHOLD_PERCENT: float = 75.0


class AttendanceThresholdStatus(str, Enum):
    """Calculated attendance threshold status."""

    SATISFACTORY = "SATISFACTORY"
    LOW_ATTENDANCE = "LOW_ATTENDANCE"


class StudentCourseAttendanceSummary(BaseModel):
    """Attendance stats and intelligence for a single course."""

    course_id: UUID
    course_code: str
    course_name: str
    total_classes: int
    attended_classes: int
    attendance_percentage: float = Field(..., description="(attended_classes / total_classes) * 100")
    status: AttendanceThresholdStatus = Field(
        default=AttendanceThresholdStatus.SATISFACTORY,
        description="SATISFACTORY (>=75%) or LOW_ATTENDANCE (<75%)",
    )
    classes_needed: int = Field(
        default=0,
        description="Minimum consecutive future classes student must attend to reach 75%",
    )


class StudentAttendanceOverviewResponse(BaseModel):
    """Comprehensive attendance summary response for a student."""

    total_classes: int
    attended_classes: int
    overall_percentage: float
    status: AttendanceThresholdStatus = Field(
        default=AttendanceThresholdStatus.SATISFACTORY,
        description="Overall attendance status",
    )
    classes_needed: int = Field(
        default=0,
        description="Overall minimum consecutive classes needed to reach 75%",
    )
    course_summaries: list[StudentCourseAttendanceSummary]
    recent_records: list[AttendanceRecordResponse]

