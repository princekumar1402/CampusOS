"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  createEvent,
  fetchEvents,
  fetchMyRegistrations,
  registerForEvent,
  unregisterFromEvent,
} from "@/services/events-clubs";
import type { Event } from "@/types";

export default function EventsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState<Event[]>([]);
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Simple form state for Admin / Faculty
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [dateTime, setDateTime] = useState<string>("");
  const [location, setLocation] = useState<string>("");
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
      const eventList = await fetchEvents();
      setEvents(eventList);

      if (user && user.role === "STUDENT") {
        const myRegs = await fetchMyRegistrations();
        setRegisteredEventIds(new Set(myRegs.map((r) => r.event_id)));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load events.";
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

  const handleRegister = async (eventId: string) => {
    setActionLoading(eventId);
    setError(null);
    try {
      await registerForEvent(eventId);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to register for event.";
      setError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnregister = async (eventId: string) => {
    setActionLoading(eventId);
    setError(null);
    try {
      await unregisterFromEvent(eventId);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to unregister from event.";
      setError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dateTime || !location) {
      setError("Please fill in title, date/time, and location.");
      return;
    }

    setCreating(true);
    setError(null);
    try {
      await createEvent({
        title,
        description: description || undefined,
        date_time: new Date(dateTime).toISOString(),
        location,
      });
      setTitle("");
      setDescription("");
      setDateTime("");
      setLocation("");
      setShowCreateForm(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create event.";
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
          <span className="text-slate-400 text-sm">Loading events...</span>
        </div>
      </div>
    );
  }

  const isStaff = user?.role === "ADMIN" || user?.role === "FACULTY";

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
              <span className="text-slate-200 font-medium">Events</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Campus Events</h1>
            <p className="text-sm text-slate-400 mt-1">
              Discover campus activities, guest lectures, workshops, and manage your registrations.
            </p>
          </div>

          {isStaff && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20"
            >
              {showCreateForm ? "Cancel" : "+ Create Event"}
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

        {/* Staff Event Creation Form */}
        {isStaff && showCreateForm && (
          <form
            onSubmit={handleCreateEvent}
            className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4 shadow-xl"
          >
            <h2 className="text-lg font-semibold text-white">Create New Campus Event</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Event Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. AI & Robotics Symposium"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Date & Time *</label>
                <input
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Location / Venue *</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Main Auditorium Hall 1"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Keynote lectures and student presentations"
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
                {creating ? "Publishing..." : "Publish Event"}
              </button>
            </div>
          </form>
        )}

        {/* Events List */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading campus events...
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 bg-slate-900/40 border border-slate-800/80 rounded-3xl text-center space-y-2">
            <div className="text-4xl mb-2">📅</div>
            <h3 className="text-lg font-semibold text-white">No upcoming events</h3>
            <p className="text-sm text-slate-400">
              There are no events scheduled on campus yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.map((event) => {
              const isRegistered = registeredEventIds.has(event.id);
              const isActing = actionLoading === event.id;

              return (
                <div
                  key={event.id}
                  className="p-6 bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-3xl space-y-4 flex flex-col justify-between shadow-xl transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="text-xl font-bold text-white tracking-tight">{event.title}</h2>
                      {isRegistered && (
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold rounded-full shrink-0">
                          ✓ Registered
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                      <span className="flex items-center gap-1.5">
                        <span>🗓️</span>
                        <span>{new Date(event.date_time).toLocaleString()}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span>📍</span>
                        <span>{event.location}</span>
                      </span>
                    </div>

                    {event.description && (
                      <p className="text-sm text-slate-300 pt-2 leading-relaxed">
                        {event.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Created {new Date(event.created_at).toLocaleDateString()}
                    </span>

                    {user?.role === "STUDENT" && (
                      <div>
                        {isRegistered ? (
                          <button
                            onClick={() => handleUnregister(event.id)}
                            disabled={isActing}
                            className="px-4 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                          >
                            {isActing ? "Updating..." : "Unregister"}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRegister(event.id)}
                            disabled={isActing}
                            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 shadow-md shadow-indigo-600/20"
                          >
                            {isActing ? "Updating..." : "Register"}
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
