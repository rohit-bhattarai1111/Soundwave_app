// ─── /checkout/success page ───────────────────────────────────────────────────
//
// Shown after a successful (mocked) payment. Reads the order summary from
// sessionStorage — the checkout page wrote it there before navigating here.
//
// WHY sessionStorage instead of a Context or URL param?
// - Context state resets when the page re-renders after CLEAR_CART — the cart
//   items we'd want to show are already gone by the time this page mounts.
// - URL params work for simple values but are messy for a full order object.
// - sessionStorage survives client-side navigation and is scoped to the tab,
//   so it's perfect for "hand this data to the next page."

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import type { CartItem } from "@/contexts/CartContext";

// ─── Types ────────────────────────────────────────────────────────────────────

// Mirror the shape written to sessionStorage in checkout/page.tsx.
interface OrderSummary {
  orderId: string;
  items: CartItem[];
  subtotal: number;
  gst: number;
  total: number;
  cardLastFour: string;
  nameOnCard: string;
  placedAt: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CheckoutSuccessPage() {
  // The order summary starts as null — we haven't read sessionStorage yet.
  // useEffect runs AFTER the component first renders in the browser, which
  // is the earliest safe point to access browser APIs like sessionStorage.
  const [order, setOrder] = useState<OrderSummary | null>(null);

  useEffect(() => {
    // Read the order the checkout page stored before navigating here.
    // JSON.parse converts the string back to a JavaScript object.
    const raw = sessionStorage.getItem("lastOrder");
    if (raw) {
      setOrder(JSON.parse(raw) as OrderSummary);
      // Remove the entry — it's only needed once, and sessionStorage
      // automatically clears when the tab closes anyway.
      sessionStorage.removeItem("lastOrder");
    }
  }, []); // [] means "run once when this component mounts"

  // Format the ISO date string into something readable.
  function formatDate(iso: string): string {
    return new Intl.DateTimeFormat("en-AU", {
      day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(new Date(iso));
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">

        {/* ── Success header ──────────────────────────────────────────────── */}
        <div className="mb-8 text-center">
          {/* Green checkmark circle */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-green-600"
              fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth={2.5}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900">Order Placed!</h1>
          <p className="mt-2 text-gray-500">
            Thanks for your purchase. Check the browser console for order details.
          </p>

          {/* Order ID + timestamp */}
          {order && (
            <div className="mt-3 space-y-0.5">
              <p className="font-mono text-sm font-semibold text-indigo-600">
                {order.orderId}
              </p>
              <p className="text-xs text-gray-400">{formatDate(order.placedAt)}</p>
            </div>
          )}
        </div>

        {/* ── Order summary card ──────────────────────────────────────────── */}
        {order ? (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">

            {/* Items */}
            <ul className="divide-y divide-gray-50">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-400">
                      {item.artist} &times; {item.quantity}
                    </p>
                  </div>
                  <span className="font-semibold text-gray-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>

            {/* Totals */}
            <div className="border-t border-gray-100 px-5 py-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>GST (10%)</span>
                <span>${order.gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2 font-bold text-gray-900">
                <span>Total charged</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment method */}
            <div className="border-t border-gray-100 px-5 py-4">
              <p className="text-sm text-gray-500">
                Charged to card ending in{" "}
                <span className="font-semibold text-gray-800">
                  •••• {order.cardLastFour}
                </span>{" "}
                held by{" "}
                <span className="font-semibold text-gray-800">{order.nameOnCard}</span>
              </p>
            </div>

          </div>
        ) : (
          // Shown if the user lands here directly without going through checkout.
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center text-gray-400">
            <p>No order data found.</p>
            <p className="mt-1 text-sm">Please complete checkout to see your summary.</p>
          </div>
        )}

        {/* ── Action links ────────────────────────────────────────────────── */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-indigo-600 px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Continue Shopping
          </Link>
          <Link href="/cart" className="text-sm text-gray-500 hover:text-indigo-600">
            View cart
          </Link>
        </div>

      </div>
    </main>
  );
}
