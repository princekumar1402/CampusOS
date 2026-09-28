"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  ClipboardCheck,
  CalendarDays,
  Wrench,
  Bell,
  BriefcaseBusiness,
  FileText,
  Bot,
  Settings2,
  ShieldAlert,
  X,
} from "lucide-react";
import type { UserRole } from "@/types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface SidebarProps {
  role?: UserRole;
  open: boolean;
  setOpen: (open: boolean) => void;
  unreadCount?: number;
}

export default function Sidebar({
  role = "STUDENT",
  open,
  setOpen,
  unreadCount = 0,
}: SidebarProps) {
  const pathname = usePathname();

  const getNavGroups = (): NavGroup[] => {
    if (role === "ADMIN") {
      return [
        {
          label: "Overview",
          items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
        },
        {
          label: "Academics",
          items: [
            { label: "Departments", href: "/dashboard/departments", icon: GraduationCap },
            { label: "Students", href: "/dashboard/students", icon: Users },
            { label: "Faculty", href: "/dashboard/faculty", icon: BookOpen },
            { label: "Attendance", href: "/dashboard/attendance", icon: ClipboardCheck },
          ],
        },
        {
          label: "Campus life",
          items: [
            { label: "Events", href: "/dashboard/events", icon: CalendarDays },
            { label: "Clubs", href: "/dashboard/clubs", icon: Users },
            { label: "CampusFix", href: "/dashboard/complaints", icon: Wrench },
            {
              label: "Notifications",
              href: "/dashboard/notifications",
              icon: Bell,
              badge: unreadCount > 0 ? unreadCount : undefined,
            },
          ],
        },
        {
          label: "Career",
          items: [
            { label: "Internships", href: "/dashboard/internships", icon: BriefcaseBusiness },
            { label: "Applications", href: "/dashboard/applications", icon: FileText },
          ],
        },
        {
          label: "Intelligence",
          items: [{ label: "Campus AI", href: "/dashboard/assistant", icon: Bot }],
        },
        {
          label: "Administration",
          items: [{ label: "System Statistics", href: "/dashboard/admin", icon: ShieldAlert }],
        },
      ];
    }

    if (role === "FACULTY") {
      return [
        {
          label: "Overview",
          items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
        },
        {
          label: "Academics",
          items: [
            { label: "Departments", href: "/dashboard/departments", icon: GraduationCap },
            { label: "Students", href: "/dashboard/students", icon: Users },
            { label: "Faculty Directory", href: "/dashboard/faculty", icon: BookOpen },
            { label: "Attendance", href: "/dashboard/attendance", icon: ClipboardCheck },
          ],
        },
        {
          label: "Campus life",
          items: [
            { label: "Events", href: "/dashboard/events", icon: CalendarDays },
            {
              label: "Notifications",
              href: "/dashboard/notifications",
              icon: Bell,
              badge: unreadCount > 0 ? unreadCount : undefined,
            },
          ],
        },
        {
          label: "Intelligence",
          items: [{ label: "Campus AI", href: "/dashboard/assistant", icon: Bot }],
        },
      ];
    }

    // Default to STUDENT navigation
    return [
      {
        label: "Overview",
        items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }],
      },
      {
        label: "Academics",
        items: [
          { label: "Departments", href: "/dashboard/departments", icon: GraduationCap },
          { label: "Attendance", href: "/dashboard/attendance", icon: ClipboardCheck },
        ],
      },
      {
        label: "Campus life",
        items: [
          { label: "Events", href: "/dashboard/events", icon: CalendarDays },
          { label: "Clubs", href: "/dashboard/clubs", icon: Users },
          { label: "CampusFix", href: "/dashboard/complaints", icon: Wrench },
          {
            label: "Notifications",
            href: "/dashboard/notifications",
            icon: Bell,
            badge: unreadCount > 0 ? unreadCount : undefined,
          },
        ],
      },
      {
        label: "Career",
        items: [
          { label: "Internships", href: "/dashboard/internships", icon: BriefcaseBusiness },
          { label: "Applications", href: "/dashboard/applications", icon: FileText },
        ],
      },
      {
        label: "Intelligence",
        items: [{ label: "Campus AI", href: "/dashboard/assistant", icon: Bot }],
      },
    ];
  };

  const navGroups = getNavGroups();

  return (
    <>
      {open && (
        <button
          aria-label="Close navigation"
          className="sidebar-overlay"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand-row">
          <div className="brand-mark">C</div>
          <div>
            <div className="brand-name">CampusOS</div>
            <div className="brand-caption">University operating system</div>
          </div>
          <button
            className="mobile-close"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X />
          </button>
        </div>

        <nav className="nav-groups" aria-label="Primary navigation">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <div className="nav-label">{group.label}</div>
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-item ${isActive ? "active" : ""}`}
                    onClick={() => setOpen(false)}
                  >
                    <IconComponent />
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="nav-count">{item.badge}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-status">
            <span className="status-dot green-dot" />
            <span>IIIT Kottayam · Operational</span>
          </div>
        </div>
      </aside>
    </>
  );
}
