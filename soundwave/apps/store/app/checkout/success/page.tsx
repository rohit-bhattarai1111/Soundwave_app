"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import type { CartItem } from "@/contexts/CartContext";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  const [order, setOrder] = useState<OrderSummary | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("lastOrder");
    if (raw) {
      setOrder(JSON.parse(raw) as OrderSummary);
      // Remove after reading — only needed once
      sessionStorage.removeItem("lastOrder");
    }
  }, []);

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

        <div className="mb-8 text-center">
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

          {order && (
            <div className="mt-3 space-y-0.5">
              <p className="font-mono text-sm font-semibold text-indigo-600">
                {order.orderId}
              </p>
              <p className="text-xs text-gray-400">{formatDate(order.placedAt)}</p>
            </div>
          )}
        </div>

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
          <Link href="/cart" className="text-sm text-gray-500 hover:text-indigo-600">
            View cart
          </Link>
        </div>

      </div>
    </main>
  );
}
