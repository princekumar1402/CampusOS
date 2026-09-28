"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import AppShell from "@/components/layout/AppShell";
import {
  fetchNotifications,
  markNotificationRead,
} from "@/services/complaints";
import type { Notification } from "@/types";
import { Bell, Check, Clock } from "lucide-react";

export default function NotificationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchNotifications();
      setNotifications(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load notifications.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const handleMarkAsRead = async (notificationId: string) => {
    setActionLoading(notificationId);
    setError(null);
    try {
      await markNotificationRead(notificationId);
      await loadNotifications();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to mark notification as read.";
      setError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading || (!user && loading)) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground text-sm font-medium">Loading notifications...</span>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <AppShell unreadCount={unreadCount}>
      <main className="dashboard">
        <div className="page-intro">
          <div>
            <div className="eyebrow">Activity & Alerts</div>
            <h1>Campus Notifications</h1>
            <p>
              Academic warnings, event reminders, service requests, and placement alerts · IIIT Kottayam
            </p>
          </div>

          {unreadCount > 0 && (
            <span className="nav-count text-xs px-3 py-1">
              {unreadCount} unread
            </span>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 mb-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-md text-xs flex items-center justify-between font-medium">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-600 dark:text-red-400 cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Notifications List */}
        {loading ? (
          <div className="p-12 text-center text-muted-foreground text-xs">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 bg-[var(--card)] border border-[var(--border)] rounded-[9px] text-center space-y-2">
            <div className="text-3xl mb-1">🔔</div>
            <h3 className="text-sm font-semibold text-foreground">All Caught Up</h3>
            <p className="text-xs text-muted-foreground">
              You have no pending notifications at this time.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {notifications.map((notif) => {
              const isActing = actionLoading === notif.id;

              return (
                <div
                  key={notif.id}
                  className={`p-4 rounded-[9px] border transition-all flex items-start justify-between gap-4 ${
                    notif.is_read
                      ? "bg-[var(--card)] border-[var(--border)] text-muted-foreground"
                      : "bg-[var(--card)] border-blue-500/40 text-foreground shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="pt-1 flex-shrink-0">
                      {notif.is_read ? (
                        <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 block" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-blue-600 block" />
                      )}
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-xs font-medium leading-relaxed text-foreground">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(notif.created_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  {!notif.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      disabled={isActing}
                      className="px-2.5 py-1 bg-muted hover:bg-muted/80 text-foreground border border-[var(--border)] rounded-md text-[11px] font-semibold transition-colors shrink-0 disabled:opacity-50 cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3 h-3 text-blue-600" />
                      <span>{isActing ? "..." : "Mark Read"}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </AppShell>
  );
}
