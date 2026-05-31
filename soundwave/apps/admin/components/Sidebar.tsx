"use client";

// Sidebar — navigation panel for the admin app.
//
// CHANGED from iteration 1:
//   Before: logout() called useAuth().logout() which cleared sessionStorage.
//   After:  signOut() from next-auth/react POSTs to /api/auth/signout,
//           which deletes the Session row from the DB and clears the browser cookie.
//           This is real revocation — the session can never be reused.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "Products",
    href: "/products",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  {
    label: "Orders",
    href: "/orders",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-shrink-0 flex-col bg-slate-900">

      <div className="flex h-16 items-center gap-2.5 border-b border-slate-800 px-6">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        <span className="text-lg font-bold text-white tracking-tight">
          Soundwave
          <span className="ml-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-widest">
            Admin
          </span>
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {NAV_ITEMS.map(({ label, href, icon }) => {
          // Exact match for "/" to avoid marking every page as active.
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white",
              ].join(" ")}
            >
              {isActive && (
                <span className="absolute left-0 h-8 w-0.5 rounded-r-full bg-emerald-500" />
              )}
              {icon}
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-3">
        {/* signOut() from next-auth/react:
            1. POSTs to /api/auth/signout
            2. NextAuth deletes the Session row from the DB
            3. Clears the session cookie in the browser
            4. Redirects to callbackUrl
            This is real revocation — the old session token can never be reused. */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>

    </aside>
  );
}
