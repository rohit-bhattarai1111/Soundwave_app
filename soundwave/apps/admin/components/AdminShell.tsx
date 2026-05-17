"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminShell({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();

  // Wait for sessionStorage to be read before rendering to avoid a layout flash
  if (isLoading) return null;

  if (!isAuthenticated) return <>{children}</>;

  return (
    <div className="flex h-screen">

      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">

        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
          <p className="text-sm font-medium text-slate-500">
            Soundwave Admin Panel
          </p>
          <AdminUserBadge />
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          {children}
        </main>

      </div>
    </div>
  );
}

// ─── AdminUserBadge ───────────────────────────────────────────────────────────
// Reads the logged-in user from context and renders their email in the top bar.

function AdminUserBadge() {
  const { user } = useAuth();

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
        AU
      </div>
      <div className="text-sm">
        <p className="font-semibold text-slate-800">Admin User</p>
        <p className="text-xs text-slate-400">{user?.email ?? "admin@soundwave.com"}</p>
      </div>
    </div>
  );
}
