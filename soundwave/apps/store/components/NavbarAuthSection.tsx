// ─── NavbarAuthSection.tsx ────────────────────────────────────────────────────
//
// The right-hand section of the Navbar that changes depending on auth state.
//
// WHY is this its own file?
// Navbar.tsx is a SERVER COMPONENT — it cannot use hooks or read Context.
// But this section needs useUser() (a hook) to decide whether to show
// "Login / Register" or "Hello, Alex + Logout". The solution is the same
// pattern used for CartIcon: extract only the dynamic piece into a "use client"
// file. The server component (Navbar) renders this client component; only
// this file's code goes into the browser JavaScript bundle.

"use client";

import Link from "next/link";
import { useUser } from "@/contexts/UserContext";

export function NavbarAuthSection() {
  // useUser() reads from UserContext — whoever is logged in (or null if nobody).
  const { user, logout } = useUser();

  // ── Logged-in state ───────────────────────────────────────────────────────
  // Show the user's name and a Logout button.
  if (user) {
    return (
      <div className="flex items-center gap-3">
        {/* Avatar initial bubble */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span className="hidden text-sm font-medium text-gray-700 sm:block">
          {user.name}
        </span>
        <button
          onClick={logout}
          className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:border-red-300 hover:text-red-500"
        >
          Logout
        </button>
      </div>
    );
  }

  // ── Logged-out state ──────────────────────────────────────────────────────
  // Show Login (pill button) and Register (text link).
  //
  // CONCEPT: Next.js <Link> vs plain <a>
  // <Link href="/login"> is Next.js's client-side navigation component.
  // Unlike a plain <a> tag, it does NOT trigger a full browser page reload.
  // Instead, Next.js fetches only the new page's data and swaps the content,
  // keeping the current JavaScript bundle, React tree, and context state alive.
  // This makes navigation feel instant and preserves in-memory state like the cart.
  // A plain <a href="/login"> would wipe all React state and reload everything.
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/register"
        className="hidden text-sm font-medium text-gray-600 transition-colors hover:text-indigo-600 sm:block"
      >
        Register
      </Link>
      <Link
        href="/login"
        className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
      >
        Login
      </Link>
    </div>
  );
}
