// ─── AdminShell.tsx ───────────────────────────────────────────────────────────
//
// Client wrapper that decides WHICH layout to render based on auth state.
//
// WHY a separate component instead of logic in layout.tsx?
// layout.tsx is a SERVER component — it runs on Node.js and has no access to
// React state, context, or hooks. Auth state lives in client-side sessionStorage,
// so anything that reads it must be a "use client" component.
//
// AdminShell is that client boundary: layout.tsx renders it as a black box,
// and AdminShell decides internally whether to show the full admin chrome
// (sidebar + top bar) or just the bare children (for the /login page).
//
// THREE STATES:
//   isLoading = true  → return null (waiting for sessionStorage check, avoids flash)
//   isAuthenticated   → full sidebar + topbar layout
//   not authenticated → bare {children} (the /login page fills the screen itself)

"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminShell({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();

  // Waiting for sessionStorage to be read — render nothing to avoid a flash
  // of either the login form or the (empty) admin layout.
  if (isLoading) return null;

  // Not logged in: return children without any chrome so the /login page can
  // take over the full screen with its own dark layout.
  if (!isAuthenticated) return <>{children}</>;

  // ── Authenticated: full admin chrome ───────────────────────────────────────

  return (
    <div className="flex h-screen">

      {/* Left sidebar — handles its own navigation highlighting via usePathname */}
      <Sidebar />

      {/* Right column: fixed top bar + scrollable content */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* ── Top bar ────────────────────────────────────────────────────── */}
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
          <p className="text-sm font-medium text-slate-500">
            Soundwave Admin Panel
          </p>

          {/* Admin user info — reads email from AuthContext */}
          <AdminUserBadge />
        </header>

        {/* ── Main content ───────────────────────────────────────────────── */}
        {/* overflow-y-auto keeps the sidebar + topbar fixed while long pages scroll */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          {children}
        </main>

      </div>
    </div>
  );
}

// ─── AdminUserBadge ───────────────────────────────────────────────────────────
// Reads the logged-in user from context and renders their email in the top bar.
// Extracted to keep AdminShell's JSX readable.

function AdminUserBadge() {
  const { user } = useAuth();

  return (
    <div className="flex items-center gap-3">
      {/* Avatar initials circle */}
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
