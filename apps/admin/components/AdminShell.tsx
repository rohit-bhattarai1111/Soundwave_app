"use client";

// AdminShell — the outer chrome for every authenticated admin page.
// Shows the Sidebar + top header once logged in.
//
// CHANGED from iteration 1:
//   Before: used useAuth() from AuthContext (checked sessionStorage).
//   After:  uses useSession() from NextAuth (reads the httpOnly cookie via
//           the /api/auth/session endpoint).
//           The isLoading check is now `status === "loading"` instead of
//           AuthContext's isLoading flag.
//           The isAuthenticated check is now `status === "authenticated"`.

import type { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/Sidebar";

export function AdminShell({ children }: { children: ReactNode }) {
  // useSession() returns:
  //   { data: session, status: "loading" }      — while fetching
  //   { data: session, status: "authenticated" } — logged in
  //   { data: null, status: "unauthenticated" }  — not logged in
  const { data: session, status } = useSession();

  // While NextAuth is fetching the session, render nothing to prevent flash.
  // (middleware.ts has already checked auth server-side, so this is just UX.)
  if (status === "loading") return null;

  // Not authenticated — show the children as-is (the login page).
  // middleware.ts redirects non-admins away before this even renders,
  // but the layout always wraps /login too, so we need this branch.
  if (status === "unauthenticated") return <>{children}</>;

  return (
    <div className="flex h-screen">

      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">

        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
          <p className="text-sm font-medium text-slate-500">
            Soundwave Admin Panel
          </p>
          {/* Show the logged-in admin's email from the real session */}
          <AdminUserBadge email={session?.user?.email ?? ""} />
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          {children}
        </main>

      </div>
    </div>
  );
}

// ─── AdminUserBadge ───────────────────────────────────────────────────────────

function AdminUserBadge({ email }: { email: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
        AU
      </div>
      <div className="text-sm">
        <p className="font-semibold text-slate-800">Admin User</p>
        <p className="text-xs text-slate-400">{email}</p>
      </div>
    </div>
  );
}
