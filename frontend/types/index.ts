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
// Utility Types
// ---------------------------------------------------------------------------

/** ISO 8601 datetime string */
export type ISODateString = string;

/** UUID string */
export type UUID = string;
