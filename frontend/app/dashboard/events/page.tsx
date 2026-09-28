"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import AppShell from "@/components/layout/AppShell";
import {
  createEvent,
  fetchEvents,
  fetchMyRegistrations,
  registerForEvent,
  unregisterFromEvent,
} from "@/services/events-clubs";
import type { Event } from "@/types";
import { CalendarDays, MapPin, Clock, Plus, CheckCircle2 } from "lucide-react";

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
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground text-sm font-medium">Loading events...</span>
        </div>
      </div>
    );
  }

  const isStaff = user?.role === "ADMIN" || user?.role === "FACULTY";

  return (
    <AppShell>
      <main className="dashboard">
        <div className="page-intro">
          <div>
            <div className="eyebrow">Campus Life & Engagement</div>
            <h1>Campus Events</h1>
            <p>
              Workshops, Hackathons, Guest Lectures & Student Meetups · IIIT Kottayam
            </p>
          </div>

          {isStaff && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{showCreateForm ? "Cancel" : "Create Event"}</span>
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
            className="p-5 mb-6 bg-[var(--card)] border border-[var(--border)] rounded-[9px] space-y-4 shadow-sm"
          >
            <h2 className="text-sm font-bold text-foreground">Create New Campus Event</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Event Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. AI & Robotics Symposium"
                  className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Date & Time *</label>
                <input
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Location / Venue *</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Main Auditorium Hall 1"
                  className="w-full bg-[var(--muted)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Keynote lectures and student presentations"
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
                {creating ? "Publishing..." : "Publish Event"}
              </button>
            </div>
          </form>
        )}

        {/* Events List */}
        {loading ? (
          <div className="p-12 text-center text-muted-foreground text-xs">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading campus events...
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 bg-[var(--card)] border border-[var(--border)] rounded-[9px] text-center space-y-2">
            <div className="text-3xl mb-1">📅</div>
            <h3 className="text-sm font-semibold text-foreground">No upcoming events</h3>
            <p className="text-xs text-muted-foreground">
              There are no events scheduled on campus yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((event) => {
              const isRegistered = registeredEventIds.has(event.id);
              const isActing = actionLoading === event.id;
              const dateObj = new Date(event.date_time);
              const day = isNaN(dateObj.getDate()) ? "28" : String(dateObj.getDate()).padStart(2, "0");
              const month = isNaN(dateObj.getMonth())
                ? "SEP"
                : dateObj.toLocaleString("en-US", { month: "short" }).toUpperCase();

              return (
                <div
                  key={event.id}
                  className="p-5 bg-[var(--card)] border border-[var(--border)] rounded-[9px] space-y-3 flex flex-col justify-between shadow-sm transition-all hover:border-blue-500/40"
                >
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="date-block">
                        <b>{day}</b>
                        <span>{month}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h2 className="text-sm font-bold text-foreground tracking-tight truncate">
                            {event.title}
                          </h2>
                          {isRegistered && (
                            <span className="status-badge green shrink-0">
                              ✓ Registered
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{event.location}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {event.description && (
                      <p className="text-xs text-muted-foreground pt-1 leading-relaxed line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">
                      Organized · IIIT Kottayam
                    </span>

                    {user?.role === "STUDENT" && (
                      <div>
                        {isRegistered ? (
                          <button
                            onClick={() => handleUnregister(event.id)}
                            disabled={isActing}
                            className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 rounded-md text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {isActing ? "Updating..." : "Unregister"}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRegister(event.id)}
                            disabled={isActing}
                            className="px-3.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
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
      </main>
    </AppShell>
  );
}
