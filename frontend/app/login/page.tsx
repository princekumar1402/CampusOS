"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { useTheme } from "@/context/theme-context";
import { Sun, Moon, ShieldCheck, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillTestCredentials = (testEmail: string, testPass: string) => {
    setEmail(testEmail);
    setPassword(testPass);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col justify-center items-center p-4 relative font-sans">
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="icon-button"
          aria-label="Toggle theme"
        >
          {resolvedTheme === "dark" ? <Sun /> : <Moon />}
        </button>
      </div>

      <div className="w-full max-w-md bg-[var(--card)] border border-[var(--border)] p-8 rounded-[12px] shadow-sm z-10">
        <div className="text-center mb-6">
          <div className="brand-mark mx-auto mb-3">C</div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Sign In to CampusOS
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            University Operating System · IIIT Kottayam
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-600 dark:text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. student1@campusos.test"
              className="w-full px-3 py-2 rounded-md bg-[var(--muted)] border border-[var(--border)] text-foreground placeholder-muted-foreground focus:outline-none focus:border-blue-500 text-xs"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-foreground">
                Password
              </label>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-md bg-[var(--muted)] border border-[var(--border)] text-foreground placeholder-muted-foreground focus:outline-none focus:border-blue-500 text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{isSubmitting ? "Signing in..." : "Sign In"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Quick Test Credential Picker for Convenience */}
        <div className="mt-6 pt-4 border-t border-[var(--border)]">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-2 text-center">
            Quick Fill Demo Credentials
          </span>
          <div className="flex flex-wrap gap-1.5 justify-center">
            <button
              type="button"
              onClick={() => fillTestCredentials("admin@campusos.test", "CampusOS@Admin123")}
              className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground border border-border"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => fillTestCredentials("faculty.test@campusos.test", "Faculty@123")}
              className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground border border-border"
            >
              Faculty
            </button>
            <button
              type="button"
              onClick={() => fillTestCredentials("student1@campusos.test", "Student@123")}
              className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground border border-border"
            >
              Student 1 (90%)
            </button>
            <button
              type="button"
              onClick={() => fillTestCredentials("student2@campusos.test", "Student@123")}
              className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground border border-border"
            >
              Student 2 (65%)
            </button>
            <button
              type="button"
              onClick={() => fillTestCredentials("student4@campusos.test", "Student@123")}
              className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground border border-border"
            >
              Student 4 (Events)
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
          >
            Create an account
          </Link>
        </div>
      </div>

      <div className="mt-6 text-[11px] text-muted-foreground flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>CampusOS · Encrypted with Argon2id &amp; HttpOnly JWT</span>
      </div>
    </div>
  );
}
