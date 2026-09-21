"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  createClub,
  fetchClubs,
  joinClub,
  leaveClub,
} from "@/services/events-clubs";
import type { Club } from "@/types";

export default function ClubsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [joinedClubIds, setJoinedClubIds] = useState<Set<string>>(new Set());

  // Simple form state for Admin
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [category, setCategory] = useState<string>("Technology");
  const [description, setDescription] = useState<string>("");
  const [creating, setCreating] = useState<boolean>(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const clubList = await fetchClubs();
      setClubs(clubList);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load clubs.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleJoin = async (clubId: string) => {
    setActionLoading(clubId);
    setError(null);
    try {
      await joinClub(clubId);
      setJoinedClubIds((prev) => new Set([...prev, clubId]));
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to join club.";
      setError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeave = async (clubId: string) => {
    setActionLoading(clubId);
    setError(null);
    try {
      await leaveClub(clubId);
      setJoinedClubIds((prev) => {
        const next = new Set(prev);
        next.delete(clubId);
        return next;
      });
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to leave club.";
      setError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category) {
      setError("Please provide a club name and category.");
      return;
    }

    setCreating(true);
    setError(null);
    try {
      await createClub({
        name,
        category,
        description: description || undefined,
      });
      setName("");
      setDescription("");
      setCategory("Technology");
      setShowCreateForm(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create club.";
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  if (authLoading || (!user && loading)) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 text-sm">Loading clubs...</span>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === "ADMIN";

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
              <span className="text-slate-200 font-medium">Clubs</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Student Clubs & Societies</h1>
            <p className="text-sm text-slate-400 mt-1">
              Join student-led organizations, technical societies, and cultural communities.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20"
            >
              {showCreateForm ? "Cancel" : "+ Create Club"}
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

        {/* Admin Club Creation Form */}
        {isAdmin && showCreateForm && (
          <form
            onSubmit={handleCreateClub}
            className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4 shadow-xl"
          >
            <h2 className="text-lg font-semibold text-white">Create New Club</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Club Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Robotics Club"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Category *</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Technology, Arts, Sports, Cultural"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. A community for building competitive hardware and IoT systems"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Club"}
              </button>
            </div>
          </form>
        )}

        {/* Clubs Grid */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading clubs...
          </div>
        ) : clubs.length === 0 ? (
          <div className="p-12 bg-slate-900/40 border border-slate-800/80 rounded-3xl text-center space-y-2">
            <div className="text-4xl mb-2">👥</div>
            <h3 className="text-lg font-semibold text-white">No clubs found</h3>
            <p className="text-sm text-slate-400">
              There are no student clubs registered yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clubs.map((club) => {
              const isJoined = joinedClubIds.has(club.id);
              const isActing = actionLoading === club.id;

              return (
                <div
                  key={club.id}
                  className="p-6 bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl space-y-4 flex flex-col justify-between shadow-xl transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-xs font-semibold rounded-full">
                        {club.category}
                      </span>
                      {isJoined && (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-medium rounded-full">
                          Member
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl font-bold text-white tracking-tight">{club.name}</h2>

                    {club.description && (
                      <p className="text-sm text-slate-300 leading-relaxed pt-1">
                        {club.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Founded {new Date(club.created_at).toLocaleDateString()}
                    </span>

                    {user?.role === "STUDENT" && (
                      <div>
                        {isJoined ? (
                          <button
                            onClick={() => handleLeave(club.id)}
                            disabled={isActing}
                            className="px-4 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                          >
                            {isActing ? "Leaving..." : "Leave"}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleJoin(club.id)}
                            disabled={isActing}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 shadow-md shadow-indigo-600/20"
                          >
                            {isActing ? "Joining..." : "Join"}
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
      </div>
    </div>
  );
}
