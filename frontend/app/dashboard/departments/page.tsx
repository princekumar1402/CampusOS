"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { createDepartment, fetchDepartments } from "@/services/academic";
import type { Department } from "@/types";

export default function DepartmentsPage() {
  const { user, isLoading, logout } = useAuth();
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
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 text-sm">Loading academic departments...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        {/* Header Navigation */}
        <header className="flex justify-between items-center bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-4 px-6 rounded-2xl">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-bold flex items-center justify-center hover:scale-105 transition-transform">
              COS
            </Link>
            <div>
              <h1 className="font-semibold text-white tracking-wide">Academic Departments</h1>
              <p className="text-xs text-slate-400">CampusOS Organizational Catalog</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium border border-slate-700 transition-all"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </header>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {formSuccess && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm flex items-center gap-2">
            <span>✅</span>
            <span>{formSuccess}</span>
          </div>
        )}

        {/* Admin Creation Form */}
        {user.role === "ADMIN" && (
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>🏛️</span>
              <span>Create New Department</span>
            </h2>

            <form onSubmit={handleCreateDepartment} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Department Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="CS, EE, ME"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Department Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Computer Science & Engineering"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="School of Computing"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>

              <div className="md:col-span-3 flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-purple-500/20 disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "+ Add Department"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Department Directory List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Department Catalog ({departments.length})
            </h2>
          </div>

          {departments.length === 0 ? (
            <div className="p-8 bg-slate-900/40 border border-slate-800 rounded-2xl text-center text-slate-400">
              No departments registered yet. {user.role === "ADMIN" && "Use the form above to add the first department."}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className="p-6 bg-slate-900/70 border border-slate-800 hover:border-purple-500/40 rounded-2xl transition-all shadow-lg group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-bold font-mono">
                      {dept.code}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">
                      ID: {dept.id.substring(0, 8)}...
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                    {dept.name}
                  </h3>

                  <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                    {dept.description || "No description provided."}
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-800/80 flex justify-between items-center text-[11px] text-slate-500">
                    <span>Added {new Date(dept.created_at).toLocaleDateString()}</span>
                    <span className="text-indigo-400 font-medium group-hover:translate-x-1 transition-transform">
                      Active Department →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
