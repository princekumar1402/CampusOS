"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import AppShell from "@/components/layout/AppShell";
import { fetchAdminStats } from "@/services/admin";
import type { AdminStatsResponse } from "@/types";
import {
  ShieldAlert,
  Users,
  GraduationCap,
  BookOpen,
  CalendarDays,
  Wrench,
  BriefcaseBusiness,
  FileText,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

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

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground text-sm font-medium">Loading admin session...</span>
        </div>
      </div>
    );
  }

  // Role Gate: Only ADMIN users may view administrative statistics
  if (user.role !== "ADMIN") {
    return (
      <AppShell>
        <main className="dashboard flex items-center justify-center min-h-[70vh]">
          <div className="max-w-md w-full bg-[var(--card)] border border-red-500/30 rounded-[9px] p-8 text-center space-y-5 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground">Access Restricted</h1>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Administrator privileges are required to view the system metrics and administrative operations.
              </p>
              <div className="mt-3 inline-block px-2.5 py-1 rounded text-xs font-semibold bg-muted text-foreground border border-border">
                Your Role: <span className="text-red-600 dark:text-red-400">{user.role}</span>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition-colors"
            >
              Return to Student Dashboard
            </Link>
          </div>
        </main>
      </AppShell>
    );
  }

  const metricCards = stats
    ? [
        { label: "Students", value: stats.students, detail: "Registered students", icon: GraduationCap, tone: "blue" },
        { label: "Faculty", value: stats.faculty, detail: "Teaching faculty", icon: Users, tone: "slate" },
        { label: "Courses", value: stats.courses, detail: "Active catalog", icon: BookOpen, tone: "teal" },
        { label: "Events", value: stats.events, detail: "Campus activities", icon: CalendarDays, tone: "blue" },
        { label: "Clubs", value: stats.clubs, detail: "Student organizations", icon: Users, tone: "green" },
        { label: "CampusFix Issues", value: stats.complaints, detail: `${stats.open_complaints} currently open`, icon: Wrench, tone: stats.open_complaints > 0 ? "amber" : "green" },
        { label: "Internships", value: stats.internships, detail: "Published listings", icon: BriefcaseBusiness, tone: "teal" },
        { label: "Applications", value: stats.applications, detail: "Student submissions", icon: FileText, tone: "blue" },
      ]
    : [];

  return (
    <AppShell>
      <main className="dashboard">
        <div className="page-intro">
          <div>
            <div className="eyebrow">Institutional Administration</div>
            <h1>System Statistics &amp; Operations</h1>
            <p>
              Indian Institute of Information Technology Kottayam · Production Node
            </p>
          </div>

          <button
            onClick={loadStats}
            disabled={loadingStats}
            className="px-3.5 py-2 bg-muted hover:bg-muted/80 text-foreground border border-[var(--border)] rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loadingStats ? "animate-spin" : ""}`} />
            <span>Refresh Stats</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 mb-4 bg-red-500/10 border border-red-500/30 rounded-md text-red-600 dark:text-red-400 text-xs flex items-center gap-2 font-medium">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Stats Grid */}
        {loadingStats ? (
          <div className="p-12 text-center text-muted-foreground text-xs">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Aggregating institutional metrics...
          </div>
        ) : stats ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {metricCards.map((item) => (
                <div className="stat-card" key={item.label}>
                  <div className="stat-top">
                    <span className={`tone-icon ${item.tone}`}>
                      <item.icon />
                    </span>
                    <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="stat-value">{item.value}</div>
                  <div className="stat-label">{item.label}</div>
                  <div className={`stat-detail ${item.tone}`}>{item.detail}</div>
                </div>
              ))}
            </div>

            {/* Quick Management Links */}
            <div className="space-y-3 pt-2">
              <h2 className="text-sm font-bold text-foreground">
                Administrative Modules
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { title: "Department Catalog", href: "/dashboard/departments", desc: "Manage academic departments & codes" },
                  { title: "Student Directory", href: "/dashboard/students", desc: "View student profiles & batch rosters" },
                  { title: "Faculty Directory", href: "/dashboard/faculty", desc: "View teaching faculty & designations" },
                  { title: "Attendance Intelligence", href: "/dashboard/attendance", desc: "Take attendance & view thresholds" },
                  { title: "CampusFix Service Desk", href: "/dashboard/complaints", desc: "Resolve reported facility issues" },
                  { title: "Internship Programs", href: "/dashboard/internships", desc: "Post and review career placements" },
                ].map((mod) => (
                  <Link
                    key={mod.href}
                    href={mod.href}
                    className="p-4 bg-[var(--card)] hover:bg-[var(--muted)] border border-[var(--border)] rounded-[9px] transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <h3 className="text-xs font-bold text-foreground group-hover:text-blue-600 transition-colors">
                        {mod.title}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {mod.desc}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </AppShell>
  );
}
