"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import AppShell from "@/components/layout/AppShell";
import {
  createClub,
  fetchClubs,
  joinClub,
  leaveClub,
} from "@/services/events-clubs";
import type { Club } from "@/types";
import { Users, Plus } from "lucide-react";

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
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground text-sm font-medium">Loading clubs...</span>
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
            <div className="eyebrow">Student Life & Communities</div>
            <h1>Student Clubs &amp; Societies</h1>
            <p>
              Join student-led technical organizations, robotics teams, and campus chapters · IIIT Kottayam
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{showCreateForm ? "Cancel" : "Create Club"}</span>
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
            className="p-5 mb-6 bg-[var(--card)] border border-[var(--border)] rounded-[9px] space-y-4 shadow-sm"
          >
            <h2 className="text-sm font-bold text-foreground">Create New Club</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Club Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Robotics Club"
                  className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Category *</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Technology, Arts, Sports, Cultural"
                  className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. A community for building competitive hardware and IoT systems"
                  className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-3.5 py-1.5 bg-muted text-muted-foreground hover:text-foreground rounded-md text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Club"}
              </button>
            </div>
          </form>
        )}

        {/* Clubs Grid */}
        {loading ? (
          <div className="p-12 text-center text-muted-foreground text-xs">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading clubs...
          </div>
        ) : clubs.length === 0 ? (
          <div className="p-12 bg-[var(--card)] border border-[var(--border)] rounded-[9px] text-center space-y-2">
            <div className="text-3xl mb-1">👥</div>
            <h3 className="text-sm font-semibold text-foreground">No clubs found</h3>
            <p className="text-xs text-muted-foreground">
              There are no student clubs registered yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clubs.map((club) => {
              const isJoined = joinedClubIds.has(club.id);
              const isActing = actionLoading === club.id;

              return (
                <div
                  key={club.id}
                  className="p-5 bg-[var(--card)] border border-[var(--border)] rounded-[9px] space-y-3 flex flex-col justify-between shadow-sm transition-all hover:border-blue-500/40"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="status-badge blue">
                        {club.category}
                      </span>
                      {isJoined && (
                        <span className="status-badge green">
                          ✓ Member
                        </span>
                      )}
                    </div>

                    <h2 className="text-sm font-bold text-foreground tracking-tight">{club.name}</h2>

                    {club.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {club.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      Chapter · IIIT Kottayam
                    </span>

                    {user?.role === "STUDENT" && (
                      <div>
                        {isJoined ? (
                          <button
                            onClick={() => handleLeave(club.id)}
                            disabled={isActing}
                            className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {isActing ? "Leaving..." : "Leave"}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleJoin(club.id)}
                            disabled={isActing}
                            className="px-3.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
                          >
                            {isActing ? "Joining..." : "Join Club"}
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
