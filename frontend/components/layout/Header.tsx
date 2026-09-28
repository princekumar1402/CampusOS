"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Menu,
  Search,
  Command,
  Bot,
  Bell,
  ChevronDown,
  Sun,
  Moon,
  CircleHelp,
  CheckCircle2,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useTheme } from "@/context/theme-context";

interface HeaderProps {
  setOpen: (open: boolean) => void;
  unreadCount?: number;
}

export default function Header({ setOpen, unreadCount = 0 }: HeaderProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getPageTitle = (path: string) => {
    const segments = path.split("/").filter(Boolean);
    if (segments.length <= 1) return { section: "Dashboard", title: "Overview" };
    const pageName = segments[segments.length - 1];
    const formatted = pageName.charAt(0).toUpperCase() + pageName.slice(1);
    return { section: "Dashboard", title: formatted };
  };

  const { section, title } = getPageTitle(pathname);

  const getInitials = (name?: string) => {
    if (!name) return "US";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="topbar">
      <button
        className="mobile-menu"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
      >
        <Menu />
      </button>

      <div className="crumb">
        <span>{section}</span>
        <span>/</span>
        <strong>{title}</strong>
      </div>

      <div className="header-actions">
        <button
          className="search-box"
          onClick={() => router.push("/dashboard/departments")}
          type="button"
        >
          <Search />
          <span>Search courses, events, records...</span>
          <kbd>
            <Command /> K
          </kbd>
        </button>

        <Link
          href="/dashboard/assistant"
          className="icon-button"
          aria-label="Campus AI Assistant"
          title="Campus AI Assistant"
        >
          <Bot />
        </Link>

        <Link
          href="/dashboard/notifications"
          className="icon-button notification-button"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell />
          {unreadCount > 0 && <i />}
        </Link>

        <div className="profile-wrap" ref={menuRef}>
          <button
            className="profile-button"
            onClick={() => setProfileOpen(!profileOpen)}
            aria-expanded={profileOpen}
          >
            <span className="avatar">{getInitials(user?.full_name)}</span>
            <span className="profile-copy">
              <b>{user?.full_name || "Campus User"}</b>
              <small>{user?.role} · IIIT Kottayam</small>
            </span>
            <ChevronDown />
          </button>

          {profileOpen && (
            <div className="profile-menu">
              <div className="menu-heading">Appearance</div>
              <button
                className={theme === "light" ? "selected" : ""}
                onClick={() => {
                  setTheme("light");
                  setProfileOpen(false);
                }}
              >
                <Sun />
                <span>Light</span>
                {theme === "light" && <CheckCircle2 />}
              </button>
              <button
                className={theme === "dark" ? "selected" : ""}
                onClick={() => {
                  setTheme("dark");
                  setProfileOpen(false);
                }}
              >
                <Moon />
                <span>Dark</span>
                {theme === "dark" && <CheckCircle2 />}
              </button>
              <button
                className={theme === "system" ? "selected" : ""}
                onClick={() => {
                  setTheme("system");
                  setProfileOpen(false);
                }}
              >
                <CircleHelp />
                <span>System</span>
                {theme === "system" && <CheckCircle2 />}
              </button>

              <div className="menu-divider" />

              <div className="menu-heading">Account ({user?.role})</div>
              <div className="px-2 py-1 text-xs text-muted-foreground truncate">
                {user?.email}
              </div>

              <div className="menu-divider" />

              <button
                onClick={handleLogout}
                className="text-red-600 dark:text-red-400 hover:bg-red-500/10"
              >
                <LogOut />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
