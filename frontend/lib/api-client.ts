/**
 * CampusOS — API Client Foundation
 *
 * Centralized Axios instance pre-configured to communicate with the CampusOS API.
 * Handles bearer token injection and credentials for HttpOnly cookies.
 */
import axios, { AxiosError, AxiosResponse } from "axios";
import type { ApiErrorResponse } from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const API_V1 = `${API_BASE_URL}/api/v1`;

// Memory storage for access token
let accessTokenInMemory: string | null = null;

export function getAccessToken(): string | null {
  if (typeof window !== "undefined" && !accessTokenInMemory) {
    accessTokenInMemory = sessionStorage.getItem("campus_access_token");
  }
  return accessTokenInMemory;
}

export function setAccessToken(token: string | null): void {
  accessTokenInMemory = token;
  if (typeof window !== "undefined") {
    if (token) {
      sessionStorage.setItem("campus_access_token", token);
    } else {
      sessionStorage.removeItem("campus_access_token");
    }
  }
}

// ---------------------------------------------------------------------------
// Axios Instance
// ---------------------------------------------------------------------------

export const apiClient = axios.create({
  baseURL: API_V1,
  timeout: 15_000,
  withCredentials: true, // Send HttpOnly refresh_token cookies with requests
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ---------------------------------------------------------------------------
// Request Interceptor — inject Authorization Header
// ---------------------------------------------------------------------------

apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response Interceptor — automatic token refresh & clean error handling
// ---------------------------------------------------------------------------

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean });
    const isAuthRequest =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/register") ||
      originalRequest?.url?.includes("/auth/refresh");

    // Automatically attempt token refresh on 401 if not already retried
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRequest
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers && token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Use direct axios call to avoid interceptor recursion
        const refreshResponse = await axios.post<{ access_token: string }>(
          `${API_V1}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newAccessToken = refreshResponse.data.access_token;
        setAccessToken(newAccessToken);

        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        setAccessToken(null);
        const message =
          error.response?.data?.message ??
          error.message ??
          "Session expired. Please sign in again.";
        return Promise.reject(new Error(message));
      } finally {
        isRefreshing = false;
      }
    }

    const message =
      error.response?.data?.message ??
      error.message ??
      "An unexpected error occurred";

    return Promise.reject(new Error(message));
  }
);

// ---------------------------------------------------------------------------
// Typed API helpers
// ---------------------------------------------------------------------------

export async function get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  const response = await apiClient.get<T>(path, { params });
  return response.data;
}

export async function post<T, D = unknown>(path: string, data?: D): Promise<T> {
  const response = await apiClient.post<T>(path, data);
  return response.data;
}

export async function put<T, D = unknown>(path: string, data?: D): Promise<T> {
  const response = await apiClient.put<T>(path, data);
  return response.data;
}

export async function patch<T, D = unknown>(path: string, data?: D): Promise<T> {
  const response = await apiClient.patch<T>(path, data);
  return response.data;
}

export async function del<T>(path: string): Promise<T> {
  const response = await apiClient.delete<T>(path);
  return response.data;
}
