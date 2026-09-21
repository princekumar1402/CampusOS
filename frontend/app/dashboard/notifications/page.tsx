"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  fetchNotifications,
  markNotificationRead,
} from "@/services/complaints";
import type { Notification } from "@/types";

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
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400 text-sm">Loading notifications...</span>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 md:p-12 relative">
      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
              <Link href="/dashboard" className="hover:text-indigo-400 transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-slate-200 font-medium">Notifications</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 text-xs font-semibold rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Real-time updates regarding your complaints, activities, and campus notices.
            </p>
          </div>
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

        {/* Notifications List */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 bg-slate-900/40 border border-slate-800/80 rounded-3xl text-center space-y-2">
            <div className="text-4xl mb-2">🔔</div>
            <h3 className="text-lg font-semibold text-white">No notifications</h3>
            <p className="text-sm text-slate-400">
              You are all caught up! You will be notified when your complaint statuses update.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => {
              const isActing = actionLoading === notif.id;

              return (
                <div
                  key={notif.id}
                  className={`p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                    notif.is_read
                      ? "bg-slate-900/40 border-slate-800/80 text-slate-300"
                      : "bg-slate-900/90 border-indigo-500/30 text-white shadow-lg shadow-indigo-500/5"
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1">
                    <div className="pt-1">
                      {notif.is_read ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-700 block" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 block animate-pulse" />
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-relaxed">{notif.message}</p>
                      <span className="text-xs text-slate-500 block">
                        {new Date(notif.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {!notif.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      disabled={isActing}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-medium transition-all shrink-0 disabled:opacity-50"
                    >
                      {isActing ? "Marking..." : "Mark Read"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
