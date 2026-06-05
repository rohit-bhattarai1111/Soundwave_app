// Orders page — async Server Component.
// Queries Prisma directly — no fetch() round-trip needed since this runs on the server.
// Access is guaranteed by middleware.ts (ADMIN role check runs before this page renders).

import { db } from "@repo/db/client";

// Always render at request time — orders change frequently and this page queries Prisma.
export const dynamic = "force-dynamic";

// ─── Status helpers ───────────────────────────────────────────────────────────
// DB stores: "PENDING" | "PAID" | "CANCELLED"
// Full class strings — no template literals (Tailwind scanner strips dynamic classes).
const STATUS_STYLES: Record<string, string> = {
  PENDING:   "bg-amber-100  text-amber-700",
  PAID:      "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100    text-red-600",
};

const STATUS_LABELS: Record<string, string> = {
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
  // Fetch all orders with the customer (user) and each item's product info.
  // Prisma include turns this into efficient SQL joins.
  const orders = await db.order.findMany({
    include: {
      user:  true,           // → customer name + email
      items: {
        include: {
          product: true,     // → product title for the items summary column
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Compute summary stats from real data.
  const totalOrders = orders.length;
  const revenueCents = orders
    .filter((o) => o.status === "PAID")
    .reduce((sum, o) => sum + o.totalCents, 0);
  const pendingCount   = orders.filter((o) => o.status === "PENDING").length;
  const cancelledCount = orders.filter((o) => o.status === "CANCELLED").length;

  return (
    <div className="flex flex-col gap-6">

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Orders</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {totalOrders} {totalOrders === 1 ? "order" : "orders"} total
        </p>
      </div>

      {/* ── Summary stats cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total Orders</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">{totalOrders}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Revenue (Paid)</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            ${(revenueCents / 100).toFixed(2)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pending</p>
          <p className="mt-2 text-3xl font-bold text-amber-500">{pendingCount}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Cancelled</p>
          <p className="mt-2 text-3xl font-bold text-red-500">{cancelledCount}</p>
        </div>

      </div>

      {/* ── Orders table ─────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">

          <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3.5 text-left">Order ID</th>
              <th className="px-4 py-3.5 text-left">Customer</th>
              <th className="px-4 py-3.5 text-left">Items</th>
              <th className="px-4 py-3.5 text-right">Total</th>
              <th className="px-4 py-3.5 text-center">Status</th>
              <th className="px-4 py-3.5 text-right">Date</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-50">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-sm text-slate-400">
                  No orders yet.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const badge = STATUS_STYLES[order.status] ?? "bg-gray-100 text-gray-600";
                const label = STATUS_LABELS[order.status] ?? order.status;

                // Build a human-readable item summary for the Items column.
                // e.g. "Neon Horizon × 1" or "Neon Horizon × 1, +2 more"
                const firstItem  = order.items[0];
                const extraCount = order.items.length - 1;
                const itemSummary = firstItem
                  ? `${firstItem.product.title} × ${firstItem.quantity}${extraCount > 0 ? `, +${extraCount} more` : ""}`
                  : "—";

                return (
                  <tr key={order.id} className="transition-colors hover:bg-slate-50">

                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {/* Show the last 8 chars of the cuid for a short readable reference */}
                      #{order.id.slice(-8).toUpperCase()}
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{order.user.name}</p>
                      <p className="text-slate-400">{order.user.email}</p>
                    </td>

                    <td className="px-4 py-3 text-slate-700">{itemSummary}</td>

                    <td className="px-4 py-3 text-right font-semibold text-slate-800">
                      ${(order.totalCents / 100).toFixed(2)}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge}`}>
                        {label}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right text-slate-500">
                      {formatDate(order.createdAt)}
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>

        </table>
      </div>
    </div>
  );
}
