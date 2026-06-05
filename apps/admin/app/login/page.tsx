"use client";

// login/page.tsx — admin login form, wired to NextAuth Credentials provider.
//
// CHANGED from iteration 1:
//   Before: called verifyAdminLogin() (plain-text password comparison in client JS).
//   After:  calls signIn("credentials") which POSTs to /api/auth/callback/credentials.
//           The server runs authorize() in packages/auth/src/index.ts:
//             1. Looks up the user by email
//             2. bcrypt.compares the password
//             3. Returns the user (or null)
//           middleware.ts then checks role === "ADMIN" on every request.
//
// Security improvement:
//   Old approach: password stored in source code, checked in the browser.
//   New approach: password hashed in the DB, compared on the server, never
//                 sent to the browser. Credentials never leave the server.

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense } from "react";

// ─── Inner form (needs useSearchParams — must be inside Suspense) ─────────────

function LoginForm() {
  const router       = useRouter();
  // useSearchParams reads ?error=AccessDenied set by middleware.ts when a
  // non-admin tries to access the panel.
  const searchParams = useSearchParams();
  const accessDenied = searchParams.get("error") === "AccessDenied";

  const [fields,      setFields]      = useState({ email: "", password: "" });
  const [error,       setError]       = useState<string | null>(accessDenied ? "You don't have admin access." : null);
  const [loading,     setLoading]     = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // signIn("credentials") makes a POST to /api/auth/callback/credentials.
    // `redirect: false` lets us handle the redirect in JS rather than a full
    // page reload — better UX for showing errors inline.
    const result = await signIn("credentials", {
      email:    fields.email,
      password: fields.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.ok) {
      // middleware.ts checks the ADMIN role on every route.
      // If the user is not ADMIN, it redirects back to /login?error=AccessDenied.
      router.push("/products");
      router.refresh(); // re-render the Server Components so AdminShell reads the new session
    } else {
      // Vague message — don't confirm which field was wrong to an attacker.
      setError("Invalid email or password.");
    }
  }

  return (
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
        disabled={loading}
        className="mt-2 w-full rounded-full bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>

    </form>
  );
}

// ─── Page component ───────────────────────────────────────────────────────────
// LoginForm uses useSearchParams() which requires a Suspense boundary in Next.js 14.

export default function AdminLoginPage() {
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

        {/* Suspense is required because LoginForm uses useSearchParams() */}
        <Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-slate-800" />}>
          <LoginForm />
        </Suspense>

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
