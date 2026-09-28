"use client";

import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuth } from "@/context/auth-context";

interface AppShellProps {
  children: React.ReactNode;
  unreadCount?: number;
}

export default function AppShell({ children, unreadCount = 0 }: AppShellProps) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar
        role={user?.role}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        unreadCount={unreadCount}
      />
      <div className="app-content">
        <Header setOpen={setSidebarOpen} unreadCount={unreadCount} />
        {children}
      </div>
    </div>
  );
}
