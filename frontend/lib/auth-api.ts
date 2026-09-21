/**
 * CampusOS — Auth API Services
 *
 * Frontend functions for talking to backend authentication endpoints.
 */
import { post, get, setAccessToken } from "./api-client";
import type {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  UserResponse,
} from "@/types";

export async function registerApi(data: RegisterRequest): Promise<UserResponse> {
  return post<UserResponse, RegisterRequest>("/auth/register", data);
}

export async function loginApi(data: LoginRequest): Promise<TokenResponse> {
  const res = await post<TokenResponse, LoginRequest>("/auth/login", data);
  setAccessToken(res.access_token);
  return res;
}

export async function refreshApi(): Promise<TokenResponse> {
  const res = await post<TokenResponse>("/auth/refresh");
  setAccessToken(res.access_token);
  return res;
}

export async function logoutApi(): Promise<{ message: string }> {
  try {
    return await post<{ message: string }>("/auth/logout");
  } finally {
    setAccessToken(null);
  }
}

export async function getMeApi(): Promise<UserResponse> {
  return get<UserResponse>("/auth/me");
}
