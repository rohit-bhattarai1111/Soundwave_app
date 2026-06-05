// /orders — the logged-in user's order history.
//
// This is an async Server Component — it queries Prisma directly on the server.
// No useEffect, no fetch() needed.
//
// Access control:
//   - middleware.ts redirects unauthenticated users to /login before this page runs.
//   - We also call auth() here to get the userId for the DB query. The middleware
//     guarantees a valid session, so this is just to retrieve the id.

import { auth } from "@repo/auth";
import { redirect } from "next/navigation";
import { db } from "@repo/db/client";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";

// ─── Status badge helpers ─────────────────────────────────────────────────────
// Full class strings — Tailwind's scanner strips dynamically built classes.
const STATUS_BADGE: Record<string, string> = {
  PENDING:   "bg-amber-100 text-amber-700",
  PAID:      "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-600",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING:   "Pending",
  PAID:      "Paid",
  CANCELLED: "Cancelled",
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-AU", {
    day:   "numeric",
    month: "short",
    year:  "numeric",
  }).format(date);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function OrdersPage() {
  // auth() reads the session cookie server-side — this runs on the server, so no
  // "use client" needed and no network round-trip to the auth API.
  const session = await auth();
  if (!session?.user?.id) redirect("/login");  // middleware should catch this first

  // Fetch this user's orders, including each item and the related product.
  // This is a 3-level include:
  //   Order → OrderItems → Product
  // Prisma turns this into a single optimised SQL query (with JOINs or IN clauses).
  const orders = await db.order.findMany({
    where:   { userId: session.user.id },
    include: {
      items: {
        include: { product: true },  // each OrderItem gets its Product row
      },
    },
    orderBy: { createdAt: "desc" },  // most recent order first
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">

        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Your Orders</h1>
          <Link
            href="/"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            ← Continue shopping
          </Link>
        </div>

        {orders.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center gap-6 rounded-2xl border border-dashed border-gray-300 bg-white py-24 text-center">
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <div>
              <p className="text-xl font-semibold text-gray-700">No orders yet</p>
              <p className="mt-1 text-sm text-gray-400">
                Browse the store and add some albums to your cart.
              </p>
            </div>
            <Link
              href="/"
              className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              Browse Albums
            </Link>
          </div>

        ) : (
          /* Order cards list */
          <div className="flex flex-col gap-6">
            {orders.map((order) => {
              const totalDollars = order.totalCents / 100;
              // Look up badge class and label from the DB status string.
              const badge = STATUS_BADGE[order.status] ?? "bg-gray-100 text-gray-600";
              const label = STATUS_LABEL[order.status] ?? order.status;

              return (
                <div
                  key={order.id}
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                >

                  {/* ── Order header ──────────────────────────────────────────── */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-6 py-4">
                    <div>
                      {/* Show last 8 chars of the cuid for a short readable reference */}
                      <p className="font-mono text-xs font-semibold text-gray-500">
                        #{order.id.slice(-8).toUpperCase()}
                      </p>
                      <p className="mt-0.5 text-sm text-gray-400">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge}`}>
                        {label}
                      </span>
                      <span className="text-xl font-bold text-gray-900">
                        ${totalDollars.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* ── Order items list ──────────────────────────────────────── */}
                  <ul className="divide-y divide-gray-50">
                    {order.items.map((item) => {
                      const lineTotalCents = item.unitPriceCents * item.quantity;
                      return (
                        <li
                          key={item.id}
                          className="flex items-center justify-between px-6 py-3"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {item.product.title}
                            </p>
                            <p className="text-sm text-gray-400">
                              {item.product.artist}
                            </p>
                          </div>
                          <div className="text-right">
                            {/* unitPriceCents is the price at time of purchase —
                                it may differ from the current product price */}
                            <p className="text-sm text-gray-500">
                              ${(item.unitPriceCents / 100).toFixed(2)} × {item.quantity}
                            </p>
                            <p className="font-semibold text-gray-900">
                              ${(lineTotalCents / 100).toFixed(2)}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
