// Dashboard page — protection is handled by middleware.ts, not ProtectedRoute.
// middleware.ts runs before this page renders and redirects non-admins to /login.
import Link from "next/link";
import { products, orders } from "@/lib/mock-data";

// ─── Derived stats ────────────────────────────────────────────────────────────

function getDashboardStats() {
  const totalProducts = products.length;
  const totalOrders   = orders.length;
  const revenue       = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + o.amount, 0);
  const lowStock      = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const outOfStock    = products.filter((p) => p.stock === 0).length;
  return { totalProducts, totalOrders, revenue, lowStock, outOfStock };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const stats = getDashboardStats();
  const recentProducts = [...products].slice(-5).reverse();

  return (
    <div className="flex flex-col gap-8">

      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Welcome back, Admin. Here&apos;s what&apos;s happening.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Products"           value={stats.totalProducts}            colour="text-slate-800"   />
        <StatCard label="Total Orders"       value={stats.totalOrders}              colour="text-slate-800"   />
        <StatCard label="Revenue"            value={`$${stats.revenue.toFixed(2)}`} colour="text-emerald-600" />
        <StatCard label="Low / Out of Stock" value={stats.lowStock + stats.outOfStock} colour="text-red-500"  />
      </div>

      <div className="grid grid-cols-2 gap-4">

        <Link
          href="/products"
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-slate-800">Manage Products</p>
            <p className="text-sm text-slate-400">{stats.totalProducts} albums</p>
          </div>
        </Link>

        <Link
          href="/orders"
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-slate-800">View Orders</p>
            <p className="text-sm text-slate-400">{stats.totalOrders} orders</p>
          </div>
        </Link>

      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">Recent Products</h2>
          <Link href="/products" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
            View all →
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Title / Artist</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{p.title}</p>
                    <p className="text-slate-400">{p.artist}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">${p.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={
                      p.stock === 0 ? "font-semibold text-red-500"
                      : p.stock <= 5 ? "font-semibold text-amber-500"
                      : "text-slate-600"
                    }>
                      {p.stock === 0 ? "Out" : p.stock}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
// Presentational sub-component used only on this page — no need for its own file.

function StatCard({
  label,
  value,
  colour,
}: {
  label: string;
  value: string | number;
  colour: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${colour}`}>{value}</p>
    </div>
  );
}
