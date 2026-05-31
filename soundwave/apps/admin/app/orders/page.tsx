// Orders page — protection is handled by middleware.ts (role check), not ProtectedRoute.
import { orders, type OrderStatus } from "@/lib/mock-data";

// ─── Status badge styles ──────────────────────────────────────────────────────
// Full class strings — dynamic construction would be stripped at build time.
const STATUS_STYLES: Record<OrderStatus, string> = {
  completed: "bg-emerald-100 text-emerald-700",
  pending:   "bg-amber-100  text-amber-700",
  refunded:  "bg-red-100    text-red-600",
};

function formatStatus(status: OrderStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

// ─── Summary stats ────────────────────────────────────────────────────────────
// TODO iteration 2: replace with database query

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
    <div className="flex flex-col gap-6">

      <div>
        <h1 className="text-2xl font-bold text-slate-800">Orders</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {orders.length} orders in total
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total Orders</p>
          <p className="mt-2 text-3xl font-bold text-slate-800">{stats.total}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Revenue</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            ${stats.revenue.toFixed(2)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pending</p>
          <p className="mt-2 text-3xl font-bold text-amber-500">{stats.pending}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Refunded</p>
          <p className="mt-2 text-3xl font-bold text-red-500">{stats.refunded}</p>
        </div>

      </div>

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

                <td className="px-4 py-3 font-mono text-xs text-slate-500">
                  {order.id}
                </td>

                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-800">{order.customer}</p>
                  <p className="text-slate-400">{order.email}</p>
                </td>

                <td className="px-4 py-3 text-slate-700">{order.product}</td>

                <td className="px-4 py-3 text-right font-semibold text-slate-800">
                  ${order.amount.toFixed(2)}
                </td>

                <td className="px-4 py-3 text-center">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[order.status]}`}>
                    {formatStatus(order.status)}
                  </span>
                </td>

                <td className="px-4 py-3 text-right text-slate-500">
                  {formatDate(order.date)}
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
}
