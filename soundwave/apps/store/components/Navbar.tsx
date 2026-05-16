// Navbar — top navigation bar rendered on every page.
//
// This is a SERVER COMPONENT (no "use client" directive). That means:
// - It runs only on the server and sends plain HTML to the browser.
// - It cannot use useState, useEffect, or onClick handlers.
// - Because it has no interactivity, it's perfect as a server component —
//   the browser downloads less JavaScript and the page loads faster.
//
// CartIcon IS a client component (it reads from CartContext), but server
// components are allowed to render client components — Next.js handles the
// boundary automatically. Only CartIcon's code is shipped to the browser.

import { CartIcon } from "@/components/CartIcon";

export function Navbar() {
  return (
    // sticky + top-0 keeps the nav visible when the user scrolls down.
    // z-10 makes sure it layers on top of page content while scrolling.
    // shadow-sm gives a subtle bottom shadow so it feels "elevated".
    <nav className="sticky top-0 z-10 border-b border-gray-100 bg-white shadow-sm">
      {/* max-w-7xl centres the content and prevents it from stretching too
          wide on large screens. The px-* classes add horizontal padding. */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* h-16 gives the bar a fixed height. flex + justify-between pushes
            the logo to the left and the login button to the right. */}
        <div className="flex h-16 items-center justify-between">

          {/* ── Logo ─────────────────────────────────────────────────────── */}
          {/* Clicking the logo navigates back to the home page. */}
          <a href="/" className="text-2xl font-bold text-indigo-600">
            Soundwave
          </a>

          {/* ── Navigation links ─────────────────────────────────────────── */}
          {/* hidden sm:flex means: hidden on phones, visible as a flex row
              on screens 640px or wider (Tailwind's "sm" breakpoint). */}
          <div className="hidden items-center gap-6 sm:flex">
            <a
              href="#"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-indigo-600"
            >
              Browse
            </a>
            {/* CartIcon is a client component that reads cart state and shows
                the live item-count badge. Clicking it navigates to /cart. */}
            <CartIcon />
          </div>

          {/* ── Login button ─────────────────────────────────────────────── */}
          {/* rounded-full makes it a "pill" shape. This is always visible,
              even on mobile, so users can always log in. */}
          <button className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700">
            Login
          </button>

        </div>
      </div>
    </nav>
  );
}
