"use client";

// login/page.tsx — store login form, wired to the real database via NextAuth.
//
// CHANGED from iteration 1:
//   Before: handleSubmit called login() from UserContext (fake in-memory state).
//   After:  handleSubmit calls signIn("credentials") from next-auth/react.
//           NextAuth POSTs to /api/auth/callback/credentials, which runs
//           the authorize() function in packages/auth/src/index.ts.
//           If the credentials are valid, NextAuth creates a Session row in
//           the DB and sets an httpOnly cookie in the browser.

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  const [fields,      setFields]      = useState({ email: "", password: "" });
  const [errors,      setErrors]      = useState<LoginErrors>({});
  // serverError shows a message for wrong credentials (no field-level detail on
  // purpose — don't hint which field was wrong to an attacker).
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading,     setLoading]     = useState(false);

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

    // signIn("credentials", ...) from next-auth/react makes a POST to
    // /api/auth/callback/credentials. The server runs authorize() and either
    // creates a session (sets an httpOnly cookie) or returns an error.
    //
    // `redirect: false` means we handle the redirect ourselves instead of
    // NextAuth refreshing the whole page on success.
    const result = await signIn("credentials", {
      email:    fields.email,
      password: fields.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.ok) {
      // Login succeeded — redirect to home (or wherever callbackUrl says).
      // router.push refreshes the page so Server Components re-render with
      // the new session from the httpOnly cookie.
      const callbackUrl = new URLSearchParams(window.location.search).get("callbackUrl");
      router.push(callbackUrl ?? "/");
      router.refresh(); // force Server Components to re-read auth()
    } else {
      // NextAuth returns error="CredentialsSignin" for wrong password/email.
      // We show a vague message — never confirm which field was wrong.
      setServerError("Invalid email or password.");
    }
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
