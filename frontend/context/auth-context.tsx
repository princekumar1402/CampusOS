"use client";

/**
 * CampusOS — Authentication Context & Provider
 *
 * Provides current user state, login, register, and logout handlers across the application.
 */
import React, { createContext, useContext, useEffect, useState } from "react";
import type { LoginRequest, RegisterRequest, UserResponse } from "@/types";
import {
  getMeApi,
  loginApi,
  logoutApi,
  refreshApi,
  registerApi,
} from "@/lib/auth-api";
import { setAccessToken } from "@/lib/api-client";

interface AuthContextType {
  user: UserResponse | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state on app mount
  useEffect(() => {
    async function initAuth() {
      try {
        // Try fetching user profile with current access token or refreshing session
        const me = await getMeApi();
        setUser(me);
      } catch {
        try {
          // Fallback to refresh token in cookie
          const tokenRes = await refreshApi();
          setUser(tokenRes.user);
        } catch {
          // Unauthenticated state
          setAccessToken(null);
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (data: LoginRequest) => {
    setIsLoading(true);
    try {
      const res = await loginApi(data);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    setIsLoading(true);
    try {
      await registerApi(data);
      // Auto login after registration
      await login({ email: data.email, password: data.password });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutApi();
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
