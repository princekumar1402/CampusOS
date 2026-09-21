/**
 * CampusOS — Academic Service Client
 *
 * Frontend service layer for Department, Student, and Faculty endpoints.
 */
import { get, post, put } from "@/lib/api-client";
import type { Department, FacultyProfile, StudentProfile } from "@/types";

// ---------------------------------------------------------------------------
// Departments Service
// ---------------------------------------------------------------------------

export async function fetchDepartments(): Promise<Department[]> {
  return get<Department[]>("/departments");
}

export async function createDepartment(payload: {
  code: string;
  name: string;
  description?: string;
}): Promise<Department> {
  return post<Department>("/departments", payload);
}

// ---------------------------------------------------------------------------
// Student Profiles Service
// ---------------------------------------------------------------------------

export async function fetchMyStudentProfile(): Promise<StudentProfile> {
  return get<StudentProfile>("/students/me");
}

export async function updateMyStudentProfile(payload: {
  student_id?: string;
  department_id?: string;
  program?: string;
  batch_year?: number;
  cgpa?: number;
  phone_number?: string;
  bio?: string;
}): Promise<StudentProfile> {
  return put<StudentProfile>("/students/me", payload);
}

export async function fetchStudentProfiles(
  departmentId?: string
): Promise<StudentProfile[]> {
  return get<StudentProfile[]>("/students", departmentId ? { department_id: departmentId } : undefined);
}

// ---------------------------------------------------------------------------
// Faculty Profiles Service
// ---------------------------------------------------------------------------

export async function fetchMyFacultyProfile(): Promise<FacultyProfile> {
  return get<FacultyProfile>("/faculty/me");
}

export async function updateMyFacultyProfile(payload: {
  employee_id?: string;
  department_id?: string;
  designation?: string;
  specialization?: string;
  office_location?: string;
  phone_number?: string;
  bio?: string;
}): Promise<FacultyProfile> {
  return put<FacultyProfile>("/faculty/me", payload);
}

export async function fetchFacultyProfiles(
  departmentId?: string
): Promise<FacultyProfile[]> {
  return get<FacultyProfile[]>("/faculty", departmentId ? { department_id: departmentId } : undefined);
}
