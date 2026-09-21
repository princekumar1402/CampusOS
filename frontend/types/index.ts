/**
 * CampusOS — Shared TypeScript Types
 *
 * Core types shared across all frontend modules.
 */

// ---------------------------------------------------------------------------
// API Infrastructure
// ---------------------------------------------------------------------------

/** Standard error envelope returned by the CampusOS API */
export interface ApiErrorResponse {
  error: string;
  message: string;
  detail?: unknown;
}

/** Standard paginated list response */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

/** Standard query params for paginated endpoints */
export interface PaginationParams {
  page?: number;
  page_size?: number;
}

// ---------------------------------------------------------------------------
// Health Check
// ---------------------------------------------------------------------------

export interface HealthCheckResponse {
  status: "ok" | "degraded";
  app: string;
  version: string;
  uptime_seconds: number;
  dependencies: {
    database: "ok" | "unreachable";
    cache: "ok" | "unreachable";
  };
}

// ---------------------------------------------------------------------------
// User / Auth
// ---------------------------------------------------------------------------

export type UserRole = "STUDENT" | "FACULTY" | "CLUB_ADMIN" | "ADMIN";

export interface UserResponse {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login_at?: string | null;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: UserResponse;
}

// ---------------------------------------------------------------------------
// Academic & Profiles
// ---------------------------------------------------------------------------

export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  student_id: string;
  department_id?: string | null;
  program: string;
  batch_year: number;
  cgpa?: number | null;
  phone_number?: string | null;
  bio?: string | null;
  skills?: string | null;
  created_at: string;
  updated_at: string;
  user: UserResponse;
  department?: Department | null;
}

export interface FacultyProfile {
  id: string;
  user_id: string;
  employee_id: string;
  department_id?: string | null;
  designation: string;
  specialization?: string | null;
  office_location?: string | null;
  phone_number?: string | null;
  bio?: string | null;
  created_at: string;
  updated_at: string;
  user: UserResponse;
  department?: Department | null;
}

// ---------------------------------------------------------------------------
// Course & Attendance (MVP)
// ---------------------------------------------------------------------------

export type AttendanceStatus = "PRESENT" | "ABSENT";
export type AttendanceThresholdStatus = "SATISFACTORY" | "LOW_ATTENDANCE";

export interface Course {
  id: string;
  code: string;
  name: string;
  department_id?: string | null;
  faculty_id?: string | null;
  created_at: string;
  updated_at: string;
  department?: Department | null;
  faculty?: FacultyProfile | null;
}

export interface AttendanceMarkItem {
  student_profile_id: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface AttendanceBatchCreate {
  course_id: string;
  date: string;
  records: AttendanceMarkItem[];
}

export interface AttendanceRecord {
  id: string;
  course_id: string;
  student_profile_id: string;
  date: string;
  status: AttendanceStatus;
  remarks?: string | null;
  created_at: string;
  updated_at: string;
  course?: Course | null;
  student_profile?: StudentProfile | null;
}

export interface StudentCourseAttendanceSummary {
  course_id: string;
  course_code: string;
  course_name: string;
  total_classes: number;
  attended_classes: number;
  attendance_percentage: number;
  status?: AttendanceThresholdStatus;
  classes_needed?: number;
}

export interface StudentAttendanceOverview {
  total_classes: number;
  attended_classes: number;
  overall_percentage: number;
  status?: AttendanceThresholdStatus;
  classes_needed?: number;
  course_summaries: StudentCourseAttendanceSummary[];
  recent_records: AttendanceRecord[];
}

// ---------------------------------------------------------------------------
// Utility Types
// ---------------------------------------------------------------------------

/** ISO 8601 datetime string */
export type ISODateString = string;

/** UUID string */
export type UUID = string;

// ---------------------------------------------------------------------------
// Events & Clubs (Day 3 MVP)
// ---------------------------------------------------------------------------

export interface Event {
  id: string;
  title: string;
  description?: string | null;
  date_time: string;
  location: string;
  created_by: string;
  created_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  student_profile_id: string;
  registered_at: string;
}

export interface EventCreate {
  title: string;
  description?: string;
  date_time: string;
  location: string;
}

export interface Club {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  created_at: string;
}

export interface ClubMembership {
  id: string;
  club_id: string;
  student_profile_id: string;
  joined_at: string;
}

export interface ClubCreate {
  name: string;
  description?: string;
  category: string;
}

// ---------------------------------------------------------------------------
// CampusFix & Notifications (Day 4 MVP)
// ---------------------------------------------------------------------------

export type ComplaintStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  status: ComplaintStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ComplaintCreate {
  title: string;
  description: string;
  category: string;
  location: string;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Internships & Career (Day 5 MVP)
// ---------------------------------------------------------------------------

export interface SkillMatch {
  matched_skills: string[];
  missing_skills: string[];
  total_required: number;
  match_percentage: number;
}

export interface Internship {
  id: string;
  title: string;
  company: string;
  description: string;
  required_skills: string[];
  location: string;
  mode: string;
  created_by: string;
  created_at: string;
  skill_match?: SkillMatch | null;
  has_applied?: boolean;
}

export interface InternshipCreate {
  title: string;
  company: string;
  description: string;
  required_skills: string;
  location: string;
  mode: string;
}

export interface InternshipApplication {
  id: string;
  internship_id: string;
  student_profile_id: string;
  status: string;
  applied_at: string;
  internship?: Internship | null;
}

// ---------------------------------------------------------------------------
// Campus AI Assistant (Day 6 RAG MVP)
// ---------------------------------------------------------------------------

export interface AssistantSource {
  document: string;
  section?: string | null;
}

export interface AssistantAnswerResponse {
  answer: string;
  sources: AssistantSource[];
}

// ---------------------------------------------------------------------------
// Admin Dashboard & Overview (Day 7 MVP)
// ---------------------------------------------------------------------------

export interface AdminStatsResponse {
  students: number;
  faculty: number;
  courses: number;
  events: number;
  clubs: number;
  complaints: number;
  open_complaints: number;
  internships: number;
  applications: number;
}

