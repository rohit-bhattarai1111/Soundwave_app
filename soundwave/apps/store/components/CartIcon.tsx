// ─── CartIcon.tsx ─────────────────────────────────────────────────────────────
//
// This is a small, focused Client Component whose only job is to display a
// shopping-bag icon in the Navbar with a live badge showing the cart item count.
//
// WHY is this its own file instead of living inside Navbar.tsx?
//
//   Navbar.tsx is a SERVER component — it runs only on the server and cannot
//   use React hooks. But reading the cart count requires useCart(), which
//   calls useContext() — a client-only hook.
//
//   The solution: extract just the dynamic part (this badge) into its own
//   "use client" file. The server component (Navbar) can safely import and
//   render a client component. Only this file ships extra JavaScript to the
//   browser, so the rest of Navbar stays fast and server-rendered.

"use client";

import Link from "next/link";
import { useCart } from "@/contexts/CartContext";

export function CartIcon() {
  // useCart() gives us access to the cart state from CartContext.
  // Whenever an item is added or removed, this component re-renders automatically.
  const { state } = useCart();

  // Sum up all quantities to get a single number to show on the badge.
  // e.g. 2× Album A + 3× Album B = badge shows 5.
  const totalItems = state.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    // Link wraps the icon so clicking it navigates to /cart.
    // "relative" is needed so the absolute-positioned badge stays anchored to the icon.
    <Link
      href="/cart"
      aria-label={`Cart — ${totalItems} item${totalItems !== 1 ? "s" : ""}`}
      className="relative flex items-center text-gray-600 transition-colors hover:text-indigo-600"
    >
      {/* Shopping bag SVG icon — drawn inline, no image file needed.
          The path draws a bag outline: a rectangular body with a handle arc at the top. */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
        aria-hidden="true"
      >
        {/* Handle arc */}
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>

      {/* Badge — only shown when there is at least one item in the cart.
          absolute positions it relative to the Link container.
          -top-1.5 -right-1.5 tucks it into the top-right corner of the icon.
          The ring-2 ring-white creates a white outline that separates the
          badge from the icon, making it easier to read. */}
      {totalItems > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white ring-2 ring-white">
          {/* Cap displayed count at 99 — "99+" looks better than a 3-digit badge */}
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </Link>
  );
}
