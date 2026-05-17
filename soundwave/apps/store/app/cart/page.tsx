// ─── /cart page ───────────────────────────────────────────────────────────────
//
// This page shows everything currently in the cart: a table of items with
// quantity controls, per-item totals, a running subtotal, and a clear button.
//
// It must be a Client Component because it calls useCart(), which internally
// calls useContext() — a hook that only works in the browser.

"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { useCart } from "@/contexts/CartContext";

export default function CartPage() {
  // Pull both state (to render items) and dispatch (to handle button clicks)
  // from the same context. This is the same cart that ProductCard writes to —
  // Context keeps them in sync automatically.
  const { state, dispatch } = useCart();

  // Calculate how much the user owes in total.
  // price × quantity for each item, summed across all items.
  const subtotal = state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">

        {/* Page heading */}
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Your Cart</h1>

        {/* ── Empty state ─────────────────────────────────────────────────── */}
        {/* Shown only when the cart has no items at all. */}
        {state.items.length === 0 ? (
          <div className="flex flex-col items-center gap-6 rounded-2xl border border-dashed border-gray-300 bg-white py-24 text-center">
            {/* Decorative shopping-bag icon — same SVG path used in CartIcon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>

            <div>
              <p className="text-xl font-semibold text-gray-700">Your cart is empty</p>
              <p className="mt-1 text-sm text-gray-400">
                Add some albums from the store to get started.
              </p>
            </div>

            {/* Link (not <a>) for client-side navigation — no full page reload */}
            <Link
              href="/"
              className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Continue Shopping
            </Link>
          </div>

        ) : (

          // ── Filled state ──────────────────────────────────────────────────
          <div className="flex flex-col gap-8">

            {/* ── Items table ─────────────────────────────────────────────── */}
            {/* overflow-x-auto lets the table scroll horizontally on small screens
                instead of breaking the page layout. */}
            <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
              <table className="w-full text-sm">

                {/* Table header row */}
                <thead className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-6 py-4 text-left">Album</th>
                    <th className="px-6 py-4 text-right">Unit Price</th>
                    <th className="px-6 py-4 text-center">Quantity</th>
                    <th className="px-6 py-4 text-right">Line Total</th>
                    <th className="px-6 py-4 text-center">Remove</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50">
                  {state.items.map((item) => (
                    // key must be unique — item.id comes from the Album id in mock-data.ts
                    <tr key={item.id} className="transition-colors hover:bg-gray-50">

                      {/* Album title + artist */}
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">{item.title}</p>
                        <p className="text-gray-400">{item.artist}</p>
                      </td>

                      {/* Unit price — always 2 decimal places */}
                      <td className="px-6 py-4 text-right font-medium text-gray-700">
                        ${item.price.toFixed(2)}
                      </td>

                      {/* ── Quantity stepper ──────────────────────────────── */}
                      {/* Three elements side-by-side: − button | count | + button */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-3">

                          {/* Decrease button.
                              Dispatches UPDATE_QTY with quantity - 1.
                              The reducer automatically removes the item if qty hits 0,
                              so no special "remove when zero" logic is needed here. */}
                          <button
                            onClick={() =>
                              dispatch({
                                type: "UPDATE_QTY",
                                payload: { id: item.id, quantity: item.quantity - 1 },
                              })
                            }
                            aria-label={`Decrease quantity of ${item.title}`}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-indigo-400 hover:text-indigo-600"
                          >
                            −
                          </button>

                          {/* Current quantity — min-w-[2ch] stops the layout from
                              jumping when the number changes between 1 and 10. */}
                          <span className="min-w-[2ch] text-center font-semibold text-gray-900">
                            {item.quantity}
                          </span>

                          {/* Increase button.
                              Dispatches UPDATE_QTY with quantity + 1. */}
                          <button
                            onClick={() =>
                              dispatch({
                                type: "UPDATE_QTY",
                                payload: { id: item.id, quantity: item.quantity + 1 },
                              })
                            }
                            aria-label={`Increase quantity of ${item.title}`}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-colors hover:border-indigo-400 hover:text-indigo-600"
                          >
                            +
                          </button>

                        </div>
                      </td>

                      {/* Line total — unit price × quantity for this row */}
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </td>

                      {/* Remove button — dispatches REMOVE_ITEM regardless of qty */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() =>
                            dispatch({
                              type: "REMOVE_ITEM",
                              payload: { id: item.id },
                            })
                          }
                          aria-label={`Remove ${item.title} from cart`}
                          className="text-xs font-medium text-red-400 transition-colors hover:text-red-600"
                        >
                          Remove
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </div>

            {/* ── Summary bar ─────────────────────────────────────────────── */}
            {/* Right-aligned row with the subtotal on the left and action
                buttons on the right. flex-wrap lets it stack on mobile. */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-sm">

              {/* Subtotal */}
              <div>
                <p className="text-sm text-gray-500">Subtotal</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${subtotal.toFixed(2)}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3">

                {/* Clear cart — dispatches CLEAR_CART which resets items to [].
                    The empty-state branch above will then render automatically. */}
                <button
                  onClick={() => dispatch({ type: "CLEAR_CART" })}
                  className="rounded-full border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:border-red-300 hover:text-red-500"
                >
                  Clear Cart
                </button>

                {/* Checkout button — Link when cart has items, disabled button when empty.
                    <Link> cannot be `disabled`, so we render a real Link vs a
                    styled-as-disabled button depending on cart state. */}
                {state.items.length > 0 ? (
                  <Link
                    href="/checkout"
                    className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                  >
                    Checkout
                  </Link>
                ) : (
                  <button
                    disabled
                    aria-disabled="true"
                    title="Add items to your cart first"
                    className="cursor-not-allowed rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white opacity-40"
                  >
                    Checkout
                  </button>
                )}

              </div>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}
