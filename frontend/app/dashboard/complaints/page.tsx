"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  createComplaint,
  fetchAllComplaints,
  fetchMyComplaints,
  updateComplaintStatus,
} from "@/services/complaints";
import type { Complaint, ComplaintStatus } from "@/types";

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
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 text-sm">Loading complaints...</span>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === "ADMIN";

  const getStatusBadgeStyle = (status: ComplaintStatus) => {
    switch (status) {
      case "OPEN":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "IN_PROGRESS":
        return "bg-sky-500/10 text-sky-400 border-sky-500/30";
      case "RESOLVED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12 relative">
      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
              <Link href="/dashboard" className="hover:text-indigo-400 transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-slate-200 font-medium">CampusFix</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              {isAdmin ? "CampusFix Complaints (Admin)" : "CampusFix — Issue Reporting"}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {isAdmin
                ? "Review reported issues across university facilities and advance resolution lifecycle."
                : "Report maintenance, electrical, IT, or hostel issues and track real-time resolution status."}
            </p>
          </div>

          {!isAdmin && (
            <button
              onClick={() => setShowSubmitForm(!showSubmitForm)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20"
            >
              {showSubmitForm ? "Cancel" : "+ Submit Complaint"}
            </button>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-300">
              ✕
            </button>
          </div>
        )}

        {/* Student Complaint Submission Form */}
        {!isAdmin && showSubmitForm && (
          <form
            onSubmit={handleSubmitComplaint}
            className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4 shadow-xl"
          >
            <h2 className="text-lg font-semibold text-white">Report New Campus Issue</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Issue Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Broken water purifier on 3rd floor"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
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
                <label className="block text-xs font-medium text-slate-400 mb-1">Location *</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Engineering Wing B, 3rd Floor Corridor"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1">Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitForm(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Complaint"}
              </button>
            </div>
          </form>
        )}

        {/* Complaints List */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading complaints...
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-12 bg-slate-900/40 border border-slate-800/80 rounded-3xl text-center space-y-2">
            <div className="text-4xl mb-2">🛠️</div>
            <h3 className="text-lg font-semibold text-white">No complaints found</h3>
            <p className="text-sm text-slate-400">
              {isAdmin
                ? "There are currently no active complaints logged across campus."
                : "You have not submitted any complaints yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((complaint) => {
              const isActing = actionLoading === complaint.id;

              return (
                <div
                  key={complaint.id}
                  className="p-6 bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl space-y-4 shadow-xl transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${getStatusBadgeStyle(
                            complaint.status
                          )}`}
                        >
                          {complaint.status}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs rounded-full">
                          {complaint.category}
                        </span>
                      </div>

                      <h2 className="text-lg font-bold text-white tracking-tight pt-1">
                        {complaint.title}
                      </h2>

                      <p className="text-sm text-slate-300 leading-relaxed">
                        {complaint.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2">
                        <span>📍 {complaint.location}</span>
                        <span>
                          🗓️ Reported {new Date(complaint.created_at).toLocaleDateString()}
                        </span>
                        {complaint.updated_at && (
                          <span>
                            Updated {new Date(complaint.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Admin Status Lifecycle Advancement */}
                    {isAdmin && (
                      <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                        {complaint.status === "OPEN" && (
                          <button
                            onClick={() => handleAdvanceStatus(complaint.id, "OPEN")}
                            disabled={isActing}
                            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 shadow-md shadow-sky-600/20"
                          >
                            {isActing ? "Updating..." : "Mark In Progress ➔"}
                          </button>
                        )}
                        {complaint.status === "IN_PROGRESS" && (
                          <button
                            onClick={() => handleAdvanceStatus(complaint.id, "IN_PROGRESS")}
                            disabled={isActing}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 shadow-md shadow-emerald-600/20"
                          >
                            {isActing ? "Updating..." : "Resolve Issue ✓"}
                          </button>
                        )}
                        {complaint.status === "RESOLVED" && (
                          <span className="text-xs text-emerald-400 font-medium px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                            ✓ Issue Closed
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
      </div>
    </div>
  );
}
