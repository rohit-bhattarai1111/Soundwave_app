// ─── /orders page ─────────────────────────────────────────────────────────────
//
// Server Component — reads mock orders and renders them in a Tailwind table.
// No interactivity needed yet, so no "use client" required.

import { orders, type OrderStatus } from "@/lib/mock-data";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// ─── Status badge styles ──────────────────────────────────────────────────────
// Maps each OrderStatus value to a complete Tailwind class string.
// Full strings are required — dynamic construction would be stripped at build time.
const STATUS_STYLES: Record<OrderStatus, string> = {
  completed: "bg-emerald-100 text-emerald-700",
  pending:   "bg-amber-100  text-amber-700",
  refunded:  "bg-red-100    text-red-600",
};

// Capitalise the first letter for display ("pending" → "Pending").
function formatStatus(status: OrderStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

// Format an ISO date string (e.g. "2026-05-14") into a friendlier form.
// Intl.DateTimeFormat uses the browser/Node locale; this keeps formatting
// consistent across environments without a date library.
function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

// ─── Summary stats ────────────────────────────────────────────────────────────
// Derived from the mock data — in a real app these would come from the database.
function getStats() {
  const total    = orders.length;
  const revenue  = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + o.amount, 0);
  const pending  = orders.filter((o) => o.status === "pending").length;
  const refunded = orders.filter((o) => o.status === "refunded").length;
  return { total, revenue, pending, refunded };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const stats = getStats();

  return (
    <ProtectedRoute>
    <div className="flex flex-col gap-6">

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Orders</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {orders.length} orders in total
        </p>
      </div>

      {/* ── Summary stat cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">

        {/* Total orders */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total Orders</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">{stats.total}</p>
        </div>

        {/* Revenue */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Revenue</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            ${stats.revenue.toFixed(2)}
          </p>
        </div>

        {/* Pending */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pending</p>
          <p className="mt-2 text-3xl font-bold text-amber-500">{stats.pending}</p>
        </div>

        {/* Refunded */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Refunded</p>
          <p className="mt-2 text-3xl font-bold text-red-500">{stats.refunded}</p>
        </div>

      </div>

      {/* ── Orders table ───────────────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">

          <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3.5 text-left">Order ID</th>
              <th className="px-4 py-3.5 text-left">Customer</th>
              <th className="px-4 py-3.5 text-left">Product</th>
              <th className="px-4 py-3.5 text-right">Amount</th>
              <th className="px-4 py-3.5 text-center">Status</th>
              <th className="px-4 py-3.5 text-right">Date</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-50">
            {orders.map((order) => (
              <tr key={order.id} className="transition-colors hover:bg-slate-50">

                {/* Order ID — monospace for readability */}
                <td className="px-4 py-3 font-mono text-xs text-slate-500">
                  {order.id}
                </td>

                {/* Customer name + email */}
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-800">{order.customer}</p>
                  <p className="text-slate-400">{order.email}</p>
                </td>

                {/* Album purchased */}
                <td className="px-4 py-3 text-slate-700">{order.product}</td>

                {/* Amount */}
                <td className="px-4 py-3 text-right font-semibold text-slate-800">
                  ${order.amount.toFixed(2)}
                </td>

                {/* Status badge */}
                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[order.status]}`}>
                    {formatStatus(order.status)}
                  </span>
                </td>

                {/* Date */}
                <td className="px-4 py-3 text-right text-slate-500">
                  {formatDate(order.date)}
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
    </ProtectedRoute>
  );
}
