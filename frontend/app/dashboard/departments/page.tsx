"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import AppShell from "@/components/layout/AppShell";
import { createDepartment, fetchDepartments } from "@/services/academic";
import type { Department } from "@/types";
import { GraduationCap, Plus, Building2 } from "lucide-react";

export default function DepartmentsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states for Admin department creation
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      loadDepartments();
    }
  }, [user, isLoading, router]);

  const loadDepartments = async () => {
    setIsFetching(true);
    setError(null);
    try {
      const data = await fetchDepartments();
      setDepartments(data);
    } catch (err: any) {
      setError(err.message || "Failed to load departments.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFormSuccess(null);
    setIsCreating(true);

    try {
      await createDepartment({ code, name, description });
      setFormSuccess(`Department '${code.toUpperCase()}' created successfully!`);
      setCode("");
      setName("");
      setDescription("");
      loadDepartments();
    } catch (err: any) {
      setError(err.message || "Failed to create department.");
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading || isFetching) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground text-sm font-medium">Loading academic departments...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppShell>
      <main className="dashboard">
        <div className="page-intro">
          <div>
            <div className="eyebrow">Academic Structure</div>
            <h1>Academic Departments</h1>
            <p>
              Organizational Catalog &amp; Degree Programs · IIIT Kottayam
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3.5 mb-4 bg-red-500/10 border border-red-500/30 rounded-md text-red-600 dark:text-red-400 text-xs flex items-center justify-between font-medium">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="cursor-pointer">✕</button>
          </div>
        )}

        {formSuccess && (
          <div className="p-3.5 mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-md text-emerald-700 dark:text-emerald-400 text-xs flex items-center justify-between font-medium">
            <span>{formSuccess}</span>
            <button onClick={() => setFormSuccess(null)} className="cursor-pointer">✕</button>
          </div>
        )}

        {/* Admin Creation Form */}
        {user.role === "ADMIN" && (
          <div className="p-5 mb-6 bg-[var(--card)] border border-[var(--border)] rounded-[9px] space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>Create New Department</span>
            </h2>

            <form onSubmit={handleCreateDepartment} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Department Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE, ECE, MATH"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-foreground uppercase focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science and Engineering"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. School of Computer Sciences"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isCreating ? "Creating..." : "Save Department"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Department Directory List */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-foreground">
              Department Catalog ({departments.length})
            </h2>
          </div>

          {departments.length === 0 ? (
            <div className="p-12 bg-[var(--card)] border border-[var(--border)] rounded-[9px] text-center text-xs text-muted-foreground">
              No departments registered yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className="p-5 bg-[var(--card)] border border-[var(--border)] hover:border-blue-500/40 rounded-[9px] transition-all shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="status-badge blue font-mono font-bold">
                        {dept.code}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        IIIT Kottayam
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-foreground">
                      {dept.name}
                    </h3>

                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
                      {dept.description || "Official academic department of IIIT Kottayam."}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--border)] flex justify-between items-center text-[10px] text-muted-foreground">
                    <span>Est. 2026</span>
                    <span className="text-blue-600 font-medium">Active Department</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
