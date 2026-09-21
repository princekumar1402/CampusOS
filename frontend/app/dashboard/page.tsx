"use client";

import React, { useEffect } from "react";
import Link from "next/link";
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

          <div className="flex items-center gap-3">
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
          </div>
        </header>

        {/* User Profile Overview */}
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

        {/* Academic Modules Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Academic Management & Profiles
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link
              href="/dashboard/departments"
              className="p-6 bg-slate-900/70 border border-slate-800 hover:border-purple-500/50 rounded-2xl transition-all shadow-lg group"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                🏛️
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                Departments
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Browse university academic departments & organizational catalog.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-purple-400 font-medium">
                <span>View Departments</span>
                <span>→</span>
              </div>
            </Link>

            <Link
              href="/dashboard/students"
              className="p-6 bg-slate-900/70 border border-slate-800 hover:border-indigo-500/50 rounded-2xl transition-all shadow-lg group"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                🎓
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                Student Directory
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Manage student profiles, programs, CGPA, and search student records.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-indigo-400 font-medium">
                <span>Student Profiles</span>
                <span>→</span>
              </div>
            </Link>

            <Link
              href="/dashboard/faculty"
              className="p-6 bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 rounded-2xl transition-all shadow-lg group"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                👩‍🏫
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                Faculty Directory
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Explore faculty members, designations, specializations & office hours.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-amber-400 font-medium">
                <span>Faculty Profiles</span>
                <span>→</span>
              </div>
            </Link>

            <Link
              href="/dashboard/attendance"
              className="p-6 bg-slate-900/70 border border-slate-800 hover:border-emerald-500/50 rounded-2xl transition-all shadow-lg group"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                📋
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                Attendance MVP
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Mark batch attendance, record course sessions, & view student logs.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-emerald-400 font-medium">
                <span>Manage Attendance</span>
                <span>→</span>
              </div>
            </Link>

            <Link
              href="/dashboard/events"
              className="p-6 bg-slate-900/70 border border-slate-800 hover:border-cyan-500/50 rounded-2xl transition-all shadow-lg group"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                🎟️
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                Campus Events
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Browse upcoming campus activities, workshops, and register.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-cyan-400 font-medium">
                <span>View Events</span>
                <span>→</span>
              </div>
            </Link>

            <Link
              href="/dashboard/clubs"
              className="p-6 bg-slate-900/70 border border-slate-800 hover:border-rose-500/50 rounded-2xl transition-all shadow-lg group"
            >
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                👥
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-rose-300 transition-colors">
                Clubs & Societies
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Explore student organizations, technical societies, and join.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-rose-400 font-medium">
                <span>Explore Clubs</span>
                <span>→</span>
              </div>
            </Link>

            <Link
              href="/dashboard/complaints"
              className="p-6 bg-slate-900/70 border border-slate-800 hover:border-amber-500/50 rounded-2xl transition-all shadow-lg group"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                🛠️
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                CampusFix
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Report facility maintenance, electrical & IT complaints.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-amber-400 font-medium">
                <span>Issue Reporting</span>
                <span>→</span>
              </div>
            </Link>

            <Link
              href="/dashboard/notifications"
              className="p-6 bg-slate-900/70 border border-slate-800 hover:border-violet-500/50 rounded-2xl transition-all shadow-lg group"
            >
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-400 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                🔔
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">
                Notifications
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Track status updates and system alerts for your account.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-violet-400 font-medium">
                <span>View Notices</span>
                <span>→</span>
              </div>
            </Link>

            <Link
              href="/dashboard/internships"
              className="p-6 bg-slate-900/70 border border-slate-800 hover:border-blue-500/50 rounded-2xl transition-all shadow-lg group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                💼
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                Internships & Career
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Browse student opportunities with explainable skill matching.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-blue-400 font-medium">
                <span>Explore Careers</span>
                <span>→</span>
              </div>
            </Link>

            <Link
              href="/dashboard/assistant"
              className="p-6 bg-slate-900/70 border border-slate-800 hover:border-indigo-500/50 rounded-2xl transition-all shadow-lg group"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                🤖
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                Campus AI Assistant
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Grounded policy guidance on attendance, issues, events & rules.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-indigo-400 font-medium">
                <span>Ask Assistant</span>
                <span>→</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
