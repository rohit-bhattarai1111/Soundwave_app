"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminLoginPage() {
  const router    = useRouter();
  const { login } = useAuth();

  const [fields, setFields] = useState({ email: "", password: "" });
  const [error,  setError]  = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    setError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const success = login(fields.email, fields.password);
    if (success) {
      router.push("/products");
    } else {
      // Vague message intentional — don't reveal which field was wrong
      setError("Invalid email or password.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">

      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">

        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-xl font-bold tracking-tight text-white">
              Soundwave
              <span className="ml-1.5 text-xs font-semibold uppercase tracking-widest text-emerald-400">
                Admin
              </span>
            </span>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white">Sign in</h1>
          <p className="mt-1 text-sm text-slate-400">
            Enter your admin credentials to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

          {error && (
            <div className="rounded-lg border border-red-800 bg-red-950 px-4 py-3 text-sm font-medium text-red-400">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-slate-300">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="admin@soundwave.com"
              value={fields.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-slate-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={fields.password}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-full bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
          >
            Sign in
          </button>

        </form>

        {/* Remove in production — never hint at valid credentials in the UI */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Demo credentials:{" "}
          <span className="font-mono text-slate-400">admin@soundwave.com</span>
          {" / "}
          <span className="font-mono text-slate-400">admin123</span>
        </p>

      </div>
    </main>
  );
}
