"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 text-sm">Loading session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "FACULTY":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "CLUB_ADMIN":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      default:
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Top Header Navigation */}
        <header className="flex justify-between items-center bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-4 px-6 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-bold flex items-center justify-center">
              COS
            </div>
            <span className="font-semibold text-white tracking-wide">CampusOS</span>
          </div>

          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-sm font-medium border border-slate-700 transition-all flex items-center gap-2"
          >
            <span>Logout</span>
            <span>➔</span>
          </button>
        </header>

        {/* User Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-500/20">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {user.full_name}
                </h1>
                <p className="text-slate-400 text-sm">{user.email}</p>
              </div>
            </div>

            <div className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${getRoleBadgeStyle(user.role)}`}>
              Role: {user.role}
            </div>
          </div>

          {/* User Profile Information Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
            <div className="p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl">
              <span className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
                Account ID
              </span>
              <span className="font-mono text-xs text-slate-300 truncate block">
                {user.id}
              </span>
            </div>

            <div className="p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl">
              <span className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
                Account Status
              </span>
              <span className="inline-flex items-center gap-2 text-xs font-medium text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active & Verified
              </span>
            </div>

            <div className="p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl">
              <span className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
                Joined Date
              </span>
              <span className="text-xs text-slate-300">
                {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Module Placeholder Info */}
        <div className="p-6 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl text-center space-y-2">
          <p className="text-sm text-indigo-300 font-medium">
            🔒 Authentication & RBAC domain verified and active.
          </p>
          <p className="text-xs text-slate-400">
            Role-specific module dashboards (Academics, Events, CampusFix, etc.) will be unlocked in upcoming development phases.
          </p>
        </div>
      </div>
    </div>
  );
}
