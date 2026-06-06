"use client";

import type { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/Sidebar";

export function AdminShell({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (status === "unauthenticated") return <>{children}</>;

  return (
    <div className="flex h-screen">

      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">

        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
          <p className="text-sm font-medium text-slate-500">
            Soundwave Admin Panel
          </p>
          <AdminUserBadge email={session?.user?.email ?? ""} />
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          {children}
        </main>

      </div>
    </div>
  );
}

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
