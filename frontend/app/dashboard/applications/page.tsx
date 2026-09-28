"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import AppShell from "@/components/layout/AppShell";
import { fetchMyApplications } from "@/services/internships";
import type { InternshipApplication } from "@/types";
import { FileText, ArrowUpRight, Calendar, Building2 } from "lucide-react";

export default function ApplicationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [applications, setApplications] = useState<InternshipApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const loadApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMyApplications();
      setApplications(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load applications.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadApplications();
    }
  }, [user]);

  const getStatusTone = (status: string) => {
    switch (status.toUpperCase()) {
      case "SELECTED":
        return "green";
      case "REVIEWED":
        return "blue";
      case "REJECTED":
        return "red";
      case "APPLIED":
      default:
        return "amber";
    }
  };

  if (authLoading || (!user && loading)) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground text-sm font-medium">Loading applications...</span>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <main className="dashboard">
        <div className="page-intro">
          <div>
            <div className="eyebrow">Career Services · Tracking</div>
            <h1>My Internship Applications</h1>
            <p>
              Track submissions, review stages, and placement outcomes · IIIT Kottayam
            </p>
          </div>

          <Link
            href="/dashboard/internships"
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Browse More Openings</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            id="error-alert"
            className="p-3.5 mb-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-md text-xs flex items-center justify-between font-medium"
          >
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-600 dark:text-red-400 cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="p-12 text-center text-muted-foreground text-xs">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading your submitted applications...
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 bg-[var(--card)] border border-[var(--border)] rounded-[9px] text-center space-y-2">
            <div className="text-3xl mb-1">📄</div>
            <h3 className="text-sm font-semibold text-foreground">No Applications Submitted Yet</h3>
            <p className="text-xs text-muted-foreground">
              Explore available opportunities and submit your profile to get started.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard/internships"
                className="inline-block px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors"
              >
                Explore Internships
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => {
              const tone = getStatusTone(app.status);
              return (
                <div
                  key={app.id}
                  className="p-5 bg-[var(--card)] border border-[var(--border)] rounded-[9px] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-blue-500/40"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground">
                        {app.internship?.title || "Internship Opportunity"}
                      </h3>
                      <span className={`status-badge ${tone}`}>
                        {app.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{app.internship?.company || "Company Partner"}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground pt-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Applied on {new Date(app.applied_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href="/dashboard/internships"
                      className="px-3 py-1 bg-muted hover:bg-muted/80 text-foreground border border-[var(--border)] rounded-md text-xs font-medium transition-colors"
                    >
                      View Posting
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </AppShell>
  );
}
