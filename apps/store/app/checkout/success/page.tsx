"use client";

// checkout/success/page.tsx — shown after a successful Stripe payment.
//
// The checkout page stores a summary in sessionStorage before navigating here.
// We read it once (on mount) and clear it so refreshing the page shows a clean state.
//
// Note on card details: Stripe Elements processes card data inside an iframe —
// card numbers never reach our JavaScript. We therefore don't show "charged to
// card ending in ..." here (we don't have that data). The order status in the DB
// updates to PAID when the Stripe webhook fires (asynchronously after this page loads).

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import type { CartItem } from "@/contexts/CartContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderSummary {
  orderId:  string;
  placedAt: string;
  items:    CartItem[];
  subtotal: number;
  gst:      number;
  total:    number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CheckoutSuccessPage() {
  const [order, setOrder] = useState<OrderSummary | null>(null);

  useEffect(() => {
    // Read the order summary stored by the checkout page just before navigation.
    const raw = sessionStorage.getItem("lastOrder");
    if (raw) {
      setOrder(JSON.parse(raw) as OrderSummary);
      // Remove after reading — only needed once; refreshing shows the "order placed" state.
      sessionStorage.removeItem("lastOrder");
    }
  }, []);

  function formatDate(iso: string): string {
    return new Intl.DateTimeFormat("en-AU", {
      day:    "numeric",
      month:  "long",
      year:   "numeric",
      hour:   "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">

        {/* ── Success header ──────────────────────────────────────────────── */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900">Payment Successful!</h1>
          <p className="mt-2 text-gray-500">
            Thank you for your purchase. Your order is confirmed.
          </p>

          {order && (
            <div className="mt-3 space-y-0.5">
              {/* Show last 8 chars of the cuid as a short readable reference */}
              <p className="font-mono text-sm font-semibold text-indigo-600">
                Order #{order.orderId.slice(-8).toUpperCase()}
              </p>
              <p className="text-xs text-gray-400">{formatDate(order.placedAt)}</p>
            </div>
          )}
        </div>

        {/* ── Order summary card ───────────────────────────────────────────── */}
        {order ? (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">

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

            {/* Payment processed note — replaces the old "card ending in ..." display.
                Card details never reach our server when using Stripe Elements. */}
            <div className="border-t border-gray-100 px-5 py-4">
              <p className="text-sm text-gray-500">
                Payment securely processed by{" "}
                <a
                  href="https://stripe.com"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-gray-700 hover:text-indigo-600"
                >
                  Stripe
                </a>
                . Your order history is available in{" "}
                <Link href="/orders" className="font-medium text-indigo-600 hover:text-indigo-700">
                  My Orders
                </Link>
                .
              </p>
            </div>

          </div>
        ) : (
          /* No sessionStorage data — user navigated directly to this page */
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center text-gray-400">
            <p>No order data found.</p>
            <p className="mt-1 text-sm">Please complete checkout to see your summary.</p>
          </div>
        )}

        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-indigo-600 px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Continue Shopping
          </Link>
          <Link href="/orders" className="text-sm text-gray-500 hover:text-indigo-600">
            View order history
          </Link>
        </div>

      </div>
    </main>
  );
}
