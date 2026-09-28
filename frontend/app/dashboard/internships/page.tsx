"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import AppShell from "@/components/layout/AppShell";
import {
  applyToInternship,
  createInternship,
  fetchInternships,
} from "@/services/internships";
import type { Internship, InternshipCreate } from "@/types";
import { BriefcaseBusiness, Plus, MapPin, CheckCircle2, FileText, ArrowUpRight } from "lucide-react";

export default function InternshipsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Admin / Faculty Create Internship Form State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [company, setCompany] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [mode, setMode] = useState<string>("Remote");
  const [requiredSkills, setRequiredSkills] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [creating, setCreating] = useState<boolean>(false);

  const isStaffOrAdmin = user?.role === "ADMIN" || user?.role === "FACULTY";

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const loadInternships = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInternships();
      setInternships(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load internships.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadInternships();
    }
  }, [user]);

  const handleApply = async (internshipId: string) => {
    setActionLoading(internshipId);
    setError(null);
    try {
      await applyToInternship(internshipId);
      // Optimistically mark as applied in local state
      setInternships((prev) =>
        prev.map((item) =>
          item.id === internshipId ? { ...item, has_applied: true } : item
        )
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to apply to internship.";
      setError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateInternship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !company || !location || !mode || !requiredSkills || !description) {
      setError("Please fill in all required fields.");
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const payload: InternshipCreate = {
        title,
        company,
        location,
        mode,
        required_skills: requiredSkills,
        description,
      };
      await createInternship(payload);
      setTitle("");
      setCompany("");
      setLocation("");
      setMode("Remote");
      setRequiredSkills("");
      setDescription("");
      setShowCreateModal(false);
      await loadInternships();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create internship.";
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  if (authLoading || (!user && loading)) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground text-sm font-medium">Loading career opportunities...</span>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <main className="dashboard">
        <div className="page-intro">
          <div>
            <div className="eyebrow">Career & Professional Placements</div>
            <h1>Internships &amp; Opportunities</h1>
            <p>
              Verified technical internships with deterministic skill matching · IIIT Kottayam
            </p>
          </div>

          <div className="flex items-center gap-2">
            {user?.role === "STUDENT" && (
              <Link
                href="/dashboard/applications"
                className="px-3.5 py-2 bg-[var(--card)] hover:bg-[var(--muted)] text-foreground border border-[var(--border)] rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                <span>My Applications</span>
              </Link>
            )}

            {isStaffOrAdmin && (
              <button
                id="post-internship-btn"
                onClick={() => setShowCreateModal(!showCreateModal)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{showCreateModal ? "Cancel" : "Post Internship"}</span>
              </button>
            )}
          </div>
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

        {/* Modal / Form for Admin to Post Internship */}
        {showCreateModal && isStaffOrAdmin && (
          <div className="p-5 mb-6 bg-[var(--card)] border border-[var(--border)] rounded-[9px] space-y-4 shadow-sm">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
              <h2 className="text-sm font-bold text-foreground">Post New Internship Opening</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInternship}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Job Title *
                  </label>
                  <input
                    id="internship-title"
                    type="text"
                    required
                    placeholder="e.g. AI / ML Intern"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Company *
                  </label>
                  <input
                    id="internship-company"
                    type="text"
                    required
                    placeholder="e.g. TechNova Labs"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Location *
                  </label>
                  <input
                    id="internship-location"
                    type="text"
                    required
                    placeholder="e.g. Bangalore, India"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Work Mode *
                  </label>
                  <select
                    id="internship-mode"
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Required Skills * (comma-separated)
                </label>
                <input
                  id="internship-skills"
                  type="text"
                  required
                  placeholder="e.g. Python, Machine Learning, FastAPI, PyTorch"
                  value={requiredSkills}
                  onChange={(e) => setRequiredSkills(e.target.value)}
                  className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Description *
                </label>
                <textarea
                  id="internship-description"
                  rows={3}
                  required
                  placeholder="Key responsibilities, learning opportunities, prerequisites..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 bg-muted text-muted-foreground hover:text-foreground rounded-md text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="submit-internship-btn"
                  type="submit"
                  disabled={creating}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {creating ? "Posting..." : "Publish Internship"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="p-12 text-center text-muted-foreground text-xs">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading available internship opportunities...
          </div>
        ) : internships.length === 0 ? (
          <div className="p-12 bg-[var(--card)] border border-[var(--border)] rounded-[9px] text-center space-y-2">
            <div className="text-3xl mb-1">💼</div>
            <h3 className="text-sm font-semibold text-foreground">No Active Internship Postings</h3>
            <p className="text-xs text-muted-foreground">
              Check back soon for new research positions and corporate campus openings.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {internships.map((internship) => {
              const match = internship.skill_match;
              const matchPercentage = match ? match.match_percentage : 0;
              const hasApplied = internship.has_applied;
              const isActing = actionLoading === internship.id;

              return (
                <div
                  key={internship.id}
                  className="p-5 bg-[var(--card)] border border-[var(--border)] rounded-[9px] shadow-sm flex flex-col justify-between transition-all hover:border-blue-500/40"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="company-logo">
                        {internship.company.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-bold text-foreground truncate">
                            {internship.title}
                          </h3>
                          {match && matchPercentage > 0 && (
                            <span className="match-badge">
                              {matchPercentage}% match
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground block mt-0.5 font-medium">
                          {internship.company}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {internship.description}
                    </p>

                    <div className="skill-list">
                      {internship.required_skills.slice(0, 4).map((skill) => (
                        <span key={skill}>{skill}</span>
                      ))}
                    </div>

                    <div className="job-meta border-t border-[var(--border)] pt-2.5">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{internship.location} ({internship.mode})</span>
                      </span>
                      <span className="deadline font-semibold">Stipend: ₹25,000 / mo</span>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-[var(--border)] flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      Added {new Date(internship.created_at).toLocaleDateString()}
                    </span>

                    {user?.role === "STUDENT" && (
                      <div>
                        {hasApplied ? (
                          <span className="status-badge green">
                            ✓ Applied
                          </span>
                        ) : (
                          <button
                            onClick={() => handleApply(internship.id)}
                            disabled={isActing}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                          >
                            {isActing ? "Applying..." : "Apply Now"}
                          </button>
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
