"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

// ─── Email regex ──────────────────────────────────────────────────────────────
// Loose structural check — full RFC 5321 validation is not worth it client-side.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Types ────────────────────────────────────────────────────────────────────

interface RegisterErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();

  const [fields, setFields] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<RegisterErrors>({});
  // serverError holds a top-level message for failures not tied to a specific field
  // (e.g. 500 Internal Server Error, unexpected network failure).
  const [serverError, setServerError] = useState<string | null>(null);
  // loading prevents double-submit while the fetch is in flight.
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  // handleSubmit is async because it awaits the fetch to the register API.
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // ── Client-side validation (fast, no network round-trip) ─────────────────
    // We still validate on the client even though the server also validates.
    // Reason: immediate feedback while the user is filling the form.
    // The server re-validates because it's the last line of defence — a client
    // could bypass the form and send requests directly (e.g. with curl).
    const newErrors: RegisterErrors = {};

    if (fields.name.trim().length === 0) {
      newErrors.name = "Name is required.";
    }
    if (!EMAIL_REGEX.test(fields.email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (fields.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }
    if (fields.confirmPassword !== fields.password) {
      newErrors.confirmPassword = "Passwords do not match.";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // ── API call ──────────────────────────────────────────────────────────────
    setLoading(true);
    setServerError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        // JSON.stringify serialises the JS object into a string the server can parse.
        body: JSON.stringify({
          name:     fields.name,
          email:    fields.email,
          password: fields.password,
        }),
      });

      if (res.ok) {
        // 201 Created — user row is in the DB.
        // Auto sign-in: call NextAuth's credentials flow so the user doesn't
        // have to log in again immediately after registering.
        await signIn("credentials", {
          email:    fields.email,
          password: fields.password,
          redirect: false,
        });
        router.push("/");
        router.refresh(); // re-render Server Components with the new session
        return;
      }

      // Non-OK response — parse the error body.
      const data = await res.json() as { error: string; details?: Record<string, string[]> };

      if (res.status === 409) {
        // Conflict — email already registered.
        setErrors({ email: data.error });
      } else if (res.status === 400 && data.details) {
        // Validation error from Zod — map field-level messages.
        // data.details looks like { email: ["Please enter a valid email."] }
        setErrors({
          name:     data.details.name?.[0],
          email:    data.details.email?.[0],
          password: data.details.password?.[0],
        });
      } else {
        // Any other error (500, unexpected format, etc.) — show a top-level message.
        setServerError(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      // Network failure (no internet, server down, etc.)
      setServerError("Could not connect to the server. Please try again.");
    } finally {
      // Always re-enable the button whether the request succeeded or failed.
      setLoading(false);
    }
  }

  function inputClass(field: keyof RegisterErrors): string {
    const hasError = Boolean(errors[field]);
    return [
      "w-full rounded-lg border px-4 py-2.5 text-sm transition-colors",
      "focus:outline-none focus:ring-2 focus:ring-indigo-100",
      hasError
        ? "border-red-400 focus:border-red-400"
        : "border-gray-200 focus:border-indigo-400",
    ].join(" ");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">

      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">

        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold text-indigo-600">
            Soundwave
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Create an account</h1>
          <p className="mt-1 text-sm text-gray-500">
            Join Soundwave and start building your collection.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Alex Smith"
              value={fields.name}
              onChange={handleChange}
              className={inputClass("name")}
            />
            {errors.name && (
              <p className="text-xs font-medium text-red-500">{errors.name}</p>
            )}
          </div>

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
              className={inputClass("email")}
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
              autoComplete="new-password"
              placeholder="••••••••"
              value={fields.password}
              onChange={handleChange}
              className={inputClass("password")}
            />
            <p className="text-xs text-gray-400">Must be at least 6 characters.</p>
            {errors.password && (
              <p className="text-xs font-medium text-red-500">{errors.password}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={fields.confirmPassword}
              onChange={handleChange}
              className={inputClass("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs font-medium text-red-500">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          {/* Top-level server error — shown only when the error isn't tied to a field */}
          {serverError && (
            <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
              {serverError}
            </p>
          )}

          {/* disabled while loading to prevent double-submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-full bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>

        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Log in
          </Link>
        </p>

      </div>
    </main>
  );
}
