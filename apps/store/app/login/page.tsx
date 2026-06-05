"use client";

// login/page.tsx — store login form, wired to the real database via NextAuth.
//
// Auth.js v5 (beta.31) sign-in strategy:
//   We call signIn WITHOUT redirect: false so Auth.js owns the redirect fully:
//     - Valid credentials  → Auth.js redirects the browser to "/" (or callbackUrl).
//     - Wrong credentials  → Auth.js redirects to /login?error=CredentialsSignin.
//   The useEffect at mount reads ?error from the URL and shows the error message.
//
//   Why not redirect: false?
//   In beta.31, signIn({ redirect: false }) with wrong credentials returns
//   { ok: true } due to an opaque-redirect handling bug — the client can't read
//   the redirect target URL. Using Auth.js's default redirect avoids this.

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

// ─── Email regex ──────────────────────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoginErrors {
  email?:   string;
  password?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [fields,      setFields]      = useState({ email: "", password: "" });
  const [errors,      setErrors]      = useState<LoginErrors>({});
  // serverError shows a message for wrong credentials (no field-level detail on
  // purpose — don't hint which field was wrong to an attacker).
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading,     setLoading]     = useState(false);

  // Auth.js redirects to /login?error=CredentialsSignin on wrong credentials.
  // Read the error param on mount and show the message immediately.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error")) setServerError("Invalid email or password.");
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setServerError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // ── Client-side validation ─────────────────────────────────────────────
    const newErrors: LoginErrors = {};
    if (!EMAIL_REGEX.test(fields.email))  newErrors.email    = "Please enter a valid email address.";
    if (fields.password.length < 6)       newErrors.password = "Password must be at least 6 characters.";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // ── NextAuth sign-in ───────────────────────────────────────────────────
    setLoading(true);
    setServerError(null);

    // signIn() without redirect: false lets Auth.js handle the full redirect:
    //   - Success → browser navigates to "/" (or callbackUrl from the URL).
    //   - Failure → browser navigates to /login?error=CredentialsSignin.
    // The useEffect above reads ?error on the next mount and shows the message.
    const callbackUrl = new URLSearchParams(window.location.search).get("callbackUrl") ?? "/";
    await signIn("credentials", {
      email:    fields.email,
      password: fields.password,
      redirectTo: callbackUrl,
    });

    // This line is only reached if signIn() returns without navigating
    // (should not happen with default redirect behaviour, but acts as a safety net).
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">

      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">

        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold text-indigo-600">
            Soundwave
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sign in to your account to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={fields.email}
              onChange={handleChange}
              className={`w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-100 ${
                errors.email ? "border-red-400 focus:border-red-400" : "border-gray-200 focus:border-indigo-400"
              }`}
            />
            {errors.email && (
              <p className="text-xs font-medium text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
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
              className={`w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-100 ${
                errors.password ? "border-red-400 focus:border-red-400" : "border-gray-200 focus:border-indigo-400"
              }`}
            />
            {errors.password && (
              <p className="text-xs font-medium text-red-500">{errors.password}</p>
            )}
          </div>

          {/* Wrong credentials error — vague by design (security best practice) */}
          {serverError && (
            <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-full bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Log in"}
          </button>

        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Register
          </Link>
        </p>

      </div>
    </main>
  );
}
