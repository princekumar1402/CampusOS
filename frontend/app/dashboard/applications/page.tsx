"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { fetchMyApplications } from "@/services/internships";
import type { InternshipApplication } from "@/types";

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

  return (
    <div style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: "1.5rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Link
              href="/dashboard/internships"
              style={{
                fontSize: "0.875rem",
                color: "#64748b",
                textDecoration: "none",
              }}
            >
              ← Back to Internships
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
            My Internship Applications
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.95rem", marginTop: "0.25rem" }}>
            Track the status of all opportunities you have applied to.
          </p>
        </div>

        <Link
          href="/dashboard/internships"
          style={{
            padding: "0.625rem 1.25rem",
            borderRadius: "0.5rem",
            background: "#2563eb",
            color: "#ffffff",
            fontWeight: 600,
            fontSize: "0.875rem",
            textDecoration: "none",
          }}
        >
          Browse Openings
        </Link>
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

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
          <p>Loading your submitted applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3.5rem 1.5rem",
            background: "#f8fafc",
            borderRadius: "0.75rem",
            border: "1px dashed #cbd5e1",
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📄</div>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#1e293b" }}>
            No Applications Submitted Yet
          </h3>
          <p style={{ color: "#64748b", marginTop: "0.25rem", fontSize: "0.9rem" }}>
            Explore available opportunities and submit your profile to get started.
          </p>
          <Link
            href="/dashboard/internships"
            style={{
              display: "inline-block",
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              background: "#2563eb",
              color: "#ffffff",
              fontSize: "0.875rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Explore Internships
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {applications.map((app) => (
            <div
              key={app.id}
              className="application-card"
              style={{
                background: "#ffffff",
                borderRadius: "0.75rem",
                border: "1px solid #e2e8f0",
                padding: "1.25rem 1.5rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: 700,
                    color: "#0f172a",
                    marginBottom: "0.2rem",
                  }}
                >
                  {app.internship?.title || "Internship Opportunity"}
                </h3>
                <div
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    color: "#2563eb",
                    marginBottom: "0.4rem",
                  }}
                >
                  {app.internship?.company || "Company"}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Applied: {new Date(app.applied_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span
                  className="application-status-badge"
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    padding: "0.35rem 0.75rem",
                    borderRadius: "9999px",
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  {app.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
