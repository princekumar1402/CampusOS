"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  applyToInternship,
  createInternship,
  fetchInternships,
} from "@/services/internships";
import type { Internship, InternshipCreate } from "@/types";

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

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "2rem",
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: "1.5rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Link
              href="/dashboard"
              style={{
                fontSize: "0.875rem",
                color: "#64748b",
                textDecoration: "none",
              }}
            >
              ← Dashboard
            </Link>
          </div>
          <h1
            style={{
              fontSize: "1.875rem",
              fontWeight: 700,
              color: "#0f172a",
              marginTop: "0.25rem",
            }}
          >
            Internships & Career Opportunities
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.95rem", marginTop: "0.25rem" }}>
            Explore curated internship listings with explainable skill matching.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {user?.role === "STUDENT" && (
            <Link
              href="/dashboard/applications"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.625rem 1.25rem",
                borderRadius: "0.5rem",
                background: "#f1f5f9",
                color: "#334155",
                fontWeight: 600,
                fontSize: "0.875rem",
                textDecoration: "none",
                border: "1px solid #cbd5e1",
              }}
            >
              📄 My Applications
            </Link>
          )}

          {isStaffOrAdmin && (
            <button
              id="post-internship-btn"
              onClick={() => setShowCreateModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.625rem 1.25rem",
                borderRadius: "0.5rem",
                background: "#2563eb",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "0.875rem",
                border: "none",
                cursor: "pointer",
              }}
            >
              + Post Internship
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          id="error-alert"
          style={{
            padding: "1rem",
            borderRadius: "0.5rem",
            background: "#fef2f2",
            color: "#991b1b",
            border: "1px solid #f87171",
            marginBottom: "1.5rem",
            fontSize: "0.9rem",
          }}
        >
          {error}
        </div>
      )}

      {/* Modal / Form for Admin to Post Internship */}
      {showCreateModal && isStaffOrAdmin && (
        <div
          style={{
            marginBottom: "2rem",
            padding: "1.5rem",
            borderRadius: "0.75rem",
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#1e293b" }}>
              Create New Internship Posting
            </h2>
            <button
              onClick={() => setShowCreateModal(false)}
              style={{
                background: "none",
                border: "none",
                fontSize: "1.25rem",
                color: "#64748b",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleCreateInternship}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "1rem",
                marginBottom: "1rem",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "#475569",
                    marginBottom: "0.25rem",
                  }}
                >
                  Job Title *
                </label>
                <input
                  id="internship-title"
                  type="text"
                  required
                  placeholder="e.g. AI/ML Intern"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #cbd5e1",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "#475569",
                    marginBottom: "0.25rem",
                  }}
                >
                  Company *
                </label>
                <input
                  id="internship-company"
                  type="text"
                  required
                  placeholder="e.g. TechNova"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #cbd5e1",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "#475569",
                    marginBottom: "0.25rem",
                  }}
                >
                  Location *
                </label>
                <input
                  id="internship-location"
                  type="text"
                  required
                  placeholder="e.g. Bangalore or Remote"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #cbd5e1",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "#475569",
                    marginBottom: "0.25rem",
                  }}
                >
                  Work Mode *
                </label>
                <select
                  id="internship-mode"
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #cbd5e1",
                    background: "#ffffff",
                  }}
                >
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#475569",
                  marginBottom: "0.25rem",
                }}
              >
                Required Skills * (comma-separated)
              </label>
              <input
                id="internship-skills"
                type="text"
                required
                placeholder="e.g. Python, SQL, Machine Learning"
                value={requiredSkills}
                onChange={(e) => setRequiredSkills(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #cbd5e1",
                }}
              />
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#475569",
                  marginBottom: "0.25rem",
                }}
              >
                Description *
              </label>
              <textarea
                id="internship-description"
                rows={3}
                required
                placeholder="Key responsibilities, learning outcomes, and prerequisites..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #cbd5e1",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "0.375rem",
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                id="submit-internship-btn"
                type="submit"
                disabled={creating}
                style={{
                  padding: "0.5rem 1.25rem",
                  borderRadius: "0.375rem",
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 600,
                  cursor: creating ? "not-allowed" : "pointer",
                }}
              >
                {creating ? "Posting..." : "Publish Internship"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
          <p>Loading available internship opportunities...</p>
        </div>
      ) : internships.length === 0 ? (
        /* Empty State */
        <div
          style={{
            textAlign: "center",
            padding: "3.5rem 1.5rem",
            background: "#f8fafc",
            borderRadius: "0.75rem",
            border: "1px dashed #cbd5e1",
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>💼</div>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#1e293b" }}>
            No Active Internship Postings
          </h3>
          <p style={{ color: "#64748b", marginTop: "0.25rem", fontSize: "0.9rem" }}>
            Check back later for new company opportunities and research positions.
          </p>
        </div>
      ) : (
        /* Internship Cards Grid */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {internships.map((internship) => {
            const match = internship.skill_match;
            const matchPercentage = match ? match.match_percentage : 0;
            const isMatchHigh = matchPercentage >= 70;
            const isMatchMedium = matchPercentage >= 40 && matchPercentage < 70;

            return (
              <div
                key={internship.id}
                className="internship-card"
                style={{
                  background: "#ffffff",
                  borderRadius: "0.75rem",
                  border: "1px solid #e2e8f0",
                  padding: "1.5rem",
                  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  {/* Top Header: Mode Badge and Location */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "0.25rem",
                        background:
                          internship.mode === "Remote"
                            ? "#ecfdf5"
                            : internship.mode === "Hybrid"
                            ? "#eff6ff"
                            : "#fef3c7",
                        color:
                          internship.mode === "Remote"
                            ? "#047857"
                            : internship.mode === "Hybrid"
                            ? "#1d4ed8"
                            : "#b45309",
                      }}
                    >
                      {internship.mode}
                    </span>

                    <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      📍 {internship.location}
                    </span>
                  </div>

                  {/* Title & Company */}
                  <h3
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: 700,
                      color: "#0f172a",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {internship.title}
                  </h3>
                  <div
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      color: "#2563eb",
                      marginBottom: "0.75rem",
                    }}
                  >
                    {internship.company}
                  </div>

                  {/* Description */}
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#475569",
                      lineHeight: "1.4",
                      marginBottom: "1rem",
                    }}
                  >
                    {internship.description}
                  </p>

                  {/* Required Skills list */}
                  <div style={{ marginBottom: "1rem" }}>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "#64748b",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: "0.375rem",
                      }}
                    >
                      Required Skills
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                      {internship.required_skills.map((skill, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.15rem 0.5rem",
                            borderRadius: "0.25rem",
                            background: "#f1f5f9",
                            color: "#334155",
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Skill Overlap Breakdown (Student View) */}
                  {user?.role === "STUDENT" && match && (
                    <div
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "0.5rem",
                        padding: "0.875rem",
                        marginBottom: "1.25rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            color: "#334155",
                          }}
                        >
                          Skill Match:
                        </span>
                        <span
                          className="skill-match-badge"
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            padding: "0.15rem 0.5rem",
                            borderRadius: "0.25rem",
                            background: isMatchHigh
                              ? "#dcfce7"
                              : isMatchMedium
                              ? "#fef3c7"
                              : "#fee2e2",
                            color: isMatchHigh
                              ? "#15803d"
                              : isMatchMedium
                              ? "#b45309"
                              : "#b91c1c",
                          }}
                        >
                          {match.match_percentage}%
                        </span>
                      </div>

                      {/* Matched Skills */}
                      {match.matched_skills.length > 0 && (
                        <div style={{ marginBottom: "0.35rem" }}>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              color: "#166534",
                            }}
                          >
                            Matched:
                          </span>
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "0.25rem",
                              marginTop: "0.2rem",
                            }}
                          >
                            {match.matched_skills.map((s, idx) => (
                              <span
                                key={idx}
                                style={{
                                  fontSize: "0.725rem",
                                  padding: "0.1rem 0.4rem",
                                  borderRadius: "0.2rem",
                                  background: "#ecfdf5",
                                  color: "#047857",
                                  border: "1px solid #a7f3d0",
                                }}
                              >
                                ✓ {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Missing Skills */}
                      {match.missing_skills.length > 0 && (
                        <div>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              color: "#9a3412",
                            }}
                          >
                            Missing:
                          </span>
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "0.25rem",
                              marginTop: "0.2rem",
                            }}
                          >
                            {match.missing_skills.map((s, idx) => (
                              <span
                                key={idx}
                                style={{
                                  fontSize: "0.725rem",
                                  padding: "0.1rem 0.4rem",
                                  borderRadius: "0.2rem",
                                  background: "#fff7ed",
                                  color: "#c2410c",
                                  border: "1px solid #fed7aa",
                                }}
                              >
                                • {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div style={{ marginTop: "1rem" }}>
                  {user?.role === "STUDENT" ? (
                    internship.has_applied ? (
                      <button
                        disabled
                        style={{
                          width: "100%",
                          padding: "0.625rem",
                          borderRadius: "0.375rem",
                          background: "#e2e8f0",
                          color: "#64748b",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          border: "none",
                          cursor: "not-allowed",
                        }}
                      >
                        ✓ Applied
                      </button>
                    ) : (
                      <button
                        id={`apply-btn-${internship.id}`}
                        onClick={() => handleApply(internship.id)}
                        disabled={actionLoading === internship.id}
                        style={{
                          width: "100%",
                          padding: "0.625rem",
                          borderRadius: "0.375rem",
                          background: "#2563eb",
                          color: "#ffffff",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          border: "none",
                          cursor:
                            actionLoading === internship.id
                              ? "not-allowed"
                              : "pointer",
                        }}
                      >
                        {actionLoading === internship.id ? "Applying..." : "Apply"}
                      </button>
                    )
                  ) : (
                    <div
                      style={{
                        textAlign: "center",
                        fontSize: "0.8rem",
                        color: "#64748b",
                        background: "#f1f5f9",
                        padding: "0.5rem",
                        borderRadius: "0.375rem",
                      }}
                    >
                      Staff / Admin View
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
