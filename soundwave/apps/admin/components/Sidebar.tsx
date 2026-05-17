// ─── Sidebar.tsx ──────────────────────────────────────────────────────────────
//
// The left-hand navigation panel rendered on every admin page.
//
// WHY "use client" here?
// To highlight the ACTIVE nav link we need to know which URL the user is on.
// `usePathname()` from next/navigation is a React hook — hooks only work inside
// client components. The rest of layout.tsx stays a server component; only this
// sidebar file crosses into the client bundle.

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

// ─── Nav items ────────────────────────────────────────────────────────────────

// Define nav links as data so adding a new page means adding one object here,
// not hunting through JSX. The icon is an inline SVG path string.
const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/",
    // Home / grid icon
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: "Products",
    href: "/products",
    // Tag / product icon
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  {
    label: "Orders",
    href: "/orders",
    // Receipt / clipboard icon
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function Sidebar() {
  // usePathname() returns the current URL path, e.g. "/products" or "/orders".
  // React re-renders this component whenever the route changes, so the active
  // highlight stays in sync with navigation automatically.
  const pathname = usePathname();
  const router   = useRouter();
  const { logout } = useAuth();

  // Clear auth state from context + sessionStorage, then go to the login page.
  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    // h-screen + sticky top-0 keeps the sidebar fixed while page content scrolls.
    // w-64 gives it a fixed width; the rest of the layout fills the remaining space.
    <aside className="sticky top-0 flex h-screen w-64 flex-shrink-0 flex-col bg-slate-900">

      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      {/* The emerald dot acts as the visual accent colour for the whole admin. */}
      <div className="flex h-16 items-center gap-2.5 border-b border-slate-800 px-6">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        <span className="text-lg font-bold text-white tracking-tight">
          Soundwave
          <span className="ml-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-widest">
            Admin
          </span>
        </span>
      </div>

      {/* ── Navigation links ─────────────────────────────────────────────── */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {NAV_ITEMS.map(({ label, href, icon }) => {
          // Determine whether this link is "active".
          // For the home route ("/") we use exact match to avoid marking every
          // page as active. For all other routes we check if the pathname STARTS
          // with the href (so "/products/edit/1" still highlights "Products").
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={[
                // Shared classes for all nav items
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                // Active vs inactive visual styles
                isActive
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white",
              ].join(" ")}
            >
              {/* Left-edge accent bar — only visible on the active item */}
              {isActive && (
                <span className="absolute left-0 h-8 w-0.5 rounded-r-full bg-emerald-500" />
              )}
              {icon}
              {label}
            </Link>
          );
        })}
      </nav>

      {/* ── Logout button ────────────────────────────────────────────────── */}
      {/* Pinned to the bottom of the sidebar with mt-auto on the nav above */}
      <div className="border-t border-slate-800 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        >
          {/* Logout / arrow-right-from-bracket icon */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>

    </aside>
  );
}
