/**
 * CampusOS — Attendance & Course Service Client
 *
 * Frontend service layer for Courses and Attendance endpoints (MVP).
 */
import { get, post } from "@/lib/api-client";
import type {
  Course,
  AttendanceBatchCreate,
  AttendanceRecord,
  StudentAttendanceOverview,
} from "@/types";

// ---------------------------------------------------------------------------
// Course Service
// ---------------------------------------------------------------------------

export async function fetchCourses(departmentId?: string): Promise<Course[]> {
  return get<Course[]>("/courses", departmentId ? { department_id: departmentId } : undefined);
}

export async function createCourse(payload: {
  code: string;
  name: string;
  department_id?: string;
  faculty_id?: string;
}): Promise<Course> {
  return post<Course>("/courses", payload);
}

// ---------------------------------------------------------------------------
// Attendance Service
// ---------------------------------------------------------------------------

export async function markAttendanceBatch(
  payload: AttendanceBatchCreate
): Promise<AttendanceRecord[]> {
  return post<AttendanceRecord[]>("/attendance/mark", payload);
}

export async function fetchMyAttendance(): Promise<StudentAttendanceOverview> {
  return get<StudentAttendanceOverview>("/attendance/me");
}

export async function fetchCourseAttendanceRecords(
  courseId: string,
  date?: string
): Promise<AttendanceRecord[]> {
  return get<AttendanceRecord[]>(
    `/attendance/course/${courseId}`,
    date ? { date } : undefined
  );
}
