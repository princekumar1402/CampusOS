/**
 * CampusOS — Shared TypeScript Types
 *
 * Core types shared across all frontend modules.
 * Domain-specific types will live in their own files (e.g., types/students.ts)
 * as those modules are implemented.
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
// User / Auth (placeholder — will be expanded in Auth module)
// ---------------------------------------------------------------------------

export type UserRole =
  | "admin"
  | "faculty"
  | "student"
  | "staff";

export interface UserBase {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Utility Types
// ---------------------------------------------------------------------------

/** ISO 8601 datetime string */
export type ISODateString = string;

/** UUID string */
export type UUID = string;
