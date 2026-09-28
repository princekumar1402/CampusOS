"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import AppShell from "@/components/layout/AppShell";
import {
  createComplaint,
  fetchAllComplaints,
  fetchMyComplaints,
  updateComplaintStatus,
} from "@/services/complaints";
import type { Complaint, ComplaintStatus } from "@/types";
import { Wrench, Plus, MapPin, Calendar, Clock } from "lucide-react";

export default function ComplaintsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Student New Complaint Form State
  const [showSubmitForm, setShowSubmitForm] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [category, setCategory] = useState<string>("Maintenance");
  const [location, setLocation] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const loadComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      if (user?.role === "ADMIN") {
        const allList = await fetchAllComplaints();
        setComplaints(allList);
      } else {
        const myList = await fetchMyComplaints();
        setComplaints(myList);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load complaints.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadComplaints();
    }
  }, [user]);

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !category || !location || !description) {
      setError("Please fill in all required complaint fields.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await createComplaint({
        title,
        category,
        location,
        description,
      });
      setTitle("");
      setCategory("Maintenance");
      setLocation("");
      setDescription("");
      setShowSubmitForm(false);
      await loadComplaints();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit complaint.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdvanceStatus = async (
    complaintId: string,
    currentStatus: ComplaintStatus
  ) => {
    let nextStatus: ComplaintStatus | null = null;
    if (currentStatus === "OPEN") {
      nextStatus = "IN_PROGRESS";
    } else if (currentStatus === "IN_PROGRESS") {
      nextStatus = "RESOLVED";
    }

    if (!nextStatus) return;

    setActionLoading(complaintId);
    setError(null);
    try {
      await updateComplaintStatus(complaintId, nextStatus);
      await loadComplaints();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update complaint status.";
      setError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading || (!user && loading)) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground text-sm font-medium">Loading complaints...</span>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === "ADMIN";

  return (
    <AppShell>
      <main className="dashboard">
        <div className="page-intro">
          <div>
            <div className="eyebrow">Service Desk & Maintenance</div>
            <h1>CampusFix Service Desk</h1>
            <p>
              {isAdmin
                ? "Review reported facility issues and advance resolution status across campus · IIIT Kottayam"
                : "Report maintenance, electrical, Wi-Fi, or hostel issues with real-time tracking · IIIT Kottayam"}
            </p>
          </div>

          {!isAdmin && (
            <button
              onClick={() => setShowSubmitForm(!showSubmitForm)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{showSubmitForm ? "Cancel" : "Report Issue"}</span>
            </button>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 mb-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-md text-xs flex items-center justify-between font-medium">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-600 dark:text-red-400 cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Student Complaint Submission Form */}
        {!isAdmin && showSubmitForm && (
          <form
            onSubmit={handleSubmitComplaint}
            className="p-5 mb-6 bg-[var(--card)] border border-[var(--border)] rounded-[9px] space-y-4 shadow-sm"
          >
            <h2 className="text-sm font-bold text-foreground">Report New Campus Issue</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Issue Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Wi-Fi Connectivity in Block C"
                  className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="Maintenance">Maintenance</option>
                  <option value="Electrical">Electrical</option>
                  <option value="IT Support">IT Support</option>
                  <option value="Hostel">Hostel</option>
                  <option value="Classroom">Classroom</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Location *</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Academic Block 2, Room 304"
                  className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  rows={3}
                  className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitForm(false)}
                className="px-3.5 py-1.5 bg-muted text-muted-foreground hover:text-foreground rounded-md text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Complaint"}
              </button>
            </div>
          </form>
        )}

        {/* Complaints List */}
        {loading ? (
          <div className="p-12 text-center text-muted-foreground text-xs">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading complaints...
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-12 bg-[var(--card)] border border-[var(--border)] rounded-[9px] text-center space-y-2">
            <div className="text-3xl mb-1">🛠️</div>
            <h3 className="text-sm font-semibold text-foreground">No complaints found</h3>
            <p className="text-xs text-muted-foreground">
              {isAdmin
                ? "There are currently no active complaints logged across campus."
                : "You have not submitted any complaints yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {complaints.map((complaint) => {
              const isActing = actionLoading === complaint.id;
              const tone = complaint.status === "RESOLVED" ? "green" : complaint.status === "IN_PROGRESS" ? "amber" : "blue";

              return (
                <div
                  key={complaint.id}
                  className="p-5 bg-[var(--card)] border border-[var(--border)] rounded-[9px] shadow-sm transition-all hover:border-blue-500/40"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className={`fix-icon ${tone} mt-0.5`}>
                        <Wrench />
                      </span>
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`status-badge ${tone}`}>
                            {complaint.status.replace("_", " ")}
                          </span>
                          <span className="text-[10px] text-muted-foreground bg-[var(--muted)] px-2 py-0.5 rounded">
                            {complaint.category}
                          </span>
                        </div>

                        <h2 className="text-sm font-bold text-foreground tracking-tight pt-0.5">
                          {complaint.title}
                        </h2>

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {complaint.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground pt-1.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{complaint.location}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Reported {new Date(complaint.created_at).toLocaleDateString()}</span>
                          </span>
                          {complaint.updated_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Updated {new Date(complaint.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Admin Status Lifecycle Advancement */}
                    {isAdmin && (
                      <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                        {complaint.status === "OPEN" && (
                          <button
                            onClick={() => handleAdvanceStatus(complaint.id, "OPEN")}
                            disabled={isActing}
                            className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {isActing ? "Updating..." : "Mark In Progress ➔"}
                          </button>
                        )}
                        {complaint.status === "IN_PROGRESS" && (
                          <button
                            onClick={() => handleAdvanceStatus(complaint.id, "IN_PROGRESS")}
                            disabled={isActing}
                            className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {isActing ? "Updating..." : "Resolve Issue ✓"}
                          </button>
                        )}
                        {complaint.status === "RESOLVED" && (
                          <span className="status-badge green">
                            ✓ Issue Resolved
                          </span>
                        )}
                      </div>
                    )}
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
