// ─── /login page (admin) ──────────────────────────────────────────────────────
//
// The only public page in the admin app — no ProtectedRoute here.
// Uses the same controlled-input pattern as the store's /login page.
//
// Key difference from the store login: instead of setting a UserContext name and
// redirecting, this page calls login() which verifies against ADMIN_CREDENTIALS.
// If credentials are wrong, a single inline error message appears (we don't tell
// them WHICH field is wrong — that would help an attacker narrow it down).

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminLoginPage() {
  const router    = useRouter();
  const { login } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [fields, setFields] = useState({ email: "", password: "" });
  const [error,  setError]  = useState<string | null>(null);

  // ── handleChange ───────────────────────────────────────────────────────────
  //
  // Clears the error message the moment the user starts correcting their input.
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    // Any keystroke might be the user fixing the mistake — hide the error.
    setError(null);
  }

  // ── handleSubmit ───────────────────────────────────────────────────────────
  //
  // login() returns true/false synchronously (no async — there's no server call
  // yet). On success we push to /products; on failure we show one error message.
  //
  // WHY one message for both wrong email AND wrong password?
  // Telling the user "email is correct but password is wrong" confirms that the
  // account exists, giving an attacker half the information they need.
  // A vague "Invalid email or password" reveals nothing about which was wrong.
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const success = login(fields.email, fields.password);
    if (success) {
      router.push("/products");
    } else {
      setError("Invalid email or password.");
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    // Dark full-screen background matching the sidebar colour — signals admin context.
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">

      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">

        {/* ── Logo / heading ───────────────────────────────────────────────── */}
        <div className="mb-8 text-center">
          {/* Mimics the sidebar logo treatment */}
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

        {/* ── Form ─────────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

          {/* ── Global error message ───────────────────────────────────────── */}
          {/* Only shown after a failed submit — one message for both fields. */}
          {error && (
            <div className="rounded-lg border border-red-800 bg-red-950 px-4 py-3 text-sm font-medium text-red-400">
              {error}
            </div>
          )}

          {/* ── Email field ────────────────────────────────────────────────── */}
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

          {/* ── Password field ─────────────────────────────────────────────── */}
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

          {/* ── Submit ─────────────────────────────────────────────────────── */}
          <button
            type="submit"
            className="mt-2 w-full rounded-full bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
          >
            Sign in
          </button>

        </form>

        {/* ── Demo hint ────────────────────────────────────────────────────── */}
        {/* Remove this in a real app — never hint at valid credentials in the UI. */}
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
