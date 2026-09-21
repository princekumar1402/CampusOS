"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { fetchAdminStats } from "@/services/admin";
import type { AdminStatsResponse } from "@/types";

export default function AdminDashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const loadStats = async () => {
    setLoadingStats(true);
    setErrorMessage(null);
    try {
      const data = await fetchAdminStats();
      setStats(data);
    } catch (err: any) {
      const detail =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to load administrative statistics.";
      setErrorMessage(detail);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "ADMIN") {
      loadStats();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 text-sm">Loading admin session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Role Gate: Only ADMIN users may view administrative statistics
  if (user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12 flex items-center justify-center">
        <div className="max-w-md w-full bg-slate-900/90 border border-rose-500/30 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center text-3xl mx-auto">
            🚫
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Access Restricted</h1>
            <p className="text-xs text-slate-400 mt-2">
              Administrator privileges are required to view the Admin Dashboard and system metrics.
            </p>
            <div className="mt-4 inline-block px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              Current Role: <span className="text-rose-400">{user.role}</span>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all gap-2"
          >
            <span>← Return to Student/Faculty Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold flex items-center justify-center text-xl">
              🛡️
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">
                CampusOS Administration
              </h1>
              <p className="text-xs text-slate-400">
                System Overview & Infrastructure Metrics (Day 7 MVP)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadStats}
              disabled={loadingStats}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-slate-800 transition-all flex items-center gap-1.5"
            >
              <span>🔄</span>
              <span>Refresh Stats</span>
            </button>

            <Link
              href="/dashboard"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-slate-800 transition-all flex items-center gap-2"
            >
              <span>←</span>
              <span>Main Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-sm flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <div className="space-y-1">
              <p className="font-semibold">Unable to load metrics</p>
              <p className="text-xs text-rose-400">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        {loadingStats ? (
          <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800 space-y-3">
            <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Gathering system-wide database statistics...</p>
          </div>
        ) : stats ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Live CampusOS Metrics
              </h2>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                ● Connected to Live Database
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Students */}
              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1 shadow-lg">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Students</span>
                  <span className="text-lg">🎓</span>
                </div>
                <div className="text-2xl font-bold text-white">{stats.students}</div>
                <p className="text-[11px] text-slate-500">Registered student users</p>
              </div>

              {/* Faculty */}
              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1 shadow-lg">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Faculty</span>
                  <span className="text-lg">👩‍🏫</span>
                </div>
                <div className="text-2xl font-bold text-white">{stats.faculty}</div>
                <p className="text-[11px] text-slate-500">Verified instructors & staff</p>
              </div>

              {/* Courses */}
              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1 shadow-lg">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Courses</span>
                  <span className="text-lg">📚</span>
                </div>
                <div className="text-2xl font-bold text-white">{stats.courses}</div>
                <p className="text-[11px] text-slate-500">Offered academic courses</p>
              </div>

              {/* Events */}
              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1 shadow-lg">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Events</span>
                  <span className="text-lg">🎟️</span>
                </div>
                <div className="text-2xl font-bold text-white">{stats.events}</div>
                <p className="text-[11px] text-slate-500">Scheduled campus activities</p>
              </div>

              {/* Clubs */}
              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1 shadow-lg">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Clubs & Societies</span>
                  <span className="text-lg">👥</span>
                </div>
                <div className="text-2xl font-bold text-white">{stats.clubs}</div>
                <p className="text-[11px] text-slate-500">Active student organizations</p>
              </div>

              {/* Complaints Total */}
              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1 shadow-lg">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Complaints Total</span>
                  <span className="text-lg">🛠️</span>
                </div>
                <div className="text-2xl font-bold text-white">{stats.complaints}</div>
                <p className="text-[11px] text-slate-500">Logged CampusFix issues</p>
              </div>

              {/* Open Complaints */}
              <div className="p-5 bg-slate-900/80 border border-amber-500/30 bg-amber-500/5 rounded-2xl space-y-1 shadow-lg">
                <div className="flex items-center justify-between text-xs text-amber-400">
                  <span>Open Complaints</span>
                  <span className="text-lg">⚠️</span>
                </div>
                <div className="text-2xl font-bold text-amber-300">{stats.open_complaints}</div>
                <p className="text-[11px] text-amber-400/80">Pending maintenance action</p>
              </div>

              {/* Internships */}
              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1 shadow-lg">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Internships</span>
                  <span className="text-lg">💼</span>
                </div>
                <div className="text-2xl font-bold text-white">{stats.internships}</div>
                <p className="text-[11px] text-slate-500">Published career openings</p>
              </div>

              {/* Applications */}
              <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1 shadow-lg">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Applications</span>
                  <span className="text-lg">📝</span>
                </div>
                <div className="text-2xl font-bold text-white">{stats.applications}</div>
                <p className="text-[11px] text-slate-500">Submitted student applications</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Quick Management Links */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white tracking-tight">
            Administrative Shortcuts
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/dashboard/departments"
              className="p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all flex items-center justify-between text-xs text-slate-300 hover:text-white"
            >
              <span className="flex items-center gap-2">
                <span>🏛️</span>
                <span>Department Catalog</span>
              </span>
              <span>→</span>
            </Link>

            <Link
              href="/dashboard/students"
              className="p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all flex items-center justify-between text-xs text-slate-300 hover:text-white"
            >
              <span className="flex items-center gap-2">
                <span>🎓</span>
                <span>Student Directory</span>
              </span>
              <span>→</span>
            </Link>

            <Link
              href="/dashboard/faculty"
              className="p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all flex items-center justify-between text-xs text-slate-300 hover:text-white"
            >
              <span className="flex items-center gap-2">
                <span>👩‍🏫</span>
                <span>Faculty Directory</span>
              </span>
              <span>→</span>
            </Link>

            <Link
              href="/dashboard/complaints"
              className="p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all flex items-center justify-between text-xs text-slate-300 hover:text-white"
            >
              <span className="flex items-center gap-2">
                <span>🛠️</span>
                <span>CampusFix Complaints</span>
              </span>
              <span>→</span>
            </Link>

            <Link
              href="/dashboard/internships"
              className="p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all flex items-center justify-between text-xs text-slate-300 hover:text-white"
            >
              <span className="flex items-center gap-2">
                <span>💼</span>
                <span>Internships & Careers</span>
              </span>
              <span>→</span>
            </Link>

            <Link
              href="/dashboard/assistant"
              className="p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all flex items-center justify-between text-xs text-slate-300 hover:text-white"
            >
              <span className="flex items-center gap-2">
                <span>🤖</span>
                <span>Campus AI Assistant</span>
              </span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
