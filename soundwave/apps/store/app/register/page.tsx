// ─── /register page ───────────────────────────────────────────────────────────
//
// Same controlled-input pattern as /login, extended to four fields.
// Key addition: the "confirm password" field demonstrates cross-field validation
// — checking one field's value against another — which isn't possible with
// simple per-field rules.
//
// See /login for full explanations of:
//   • Controlled inputs (value + onChange)
//   • The onChange event
//   • Client-side vs server-side validation

"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Email regex ──────────────────────────────────────────────────────────────
// Same loose pattern as the login page — basic structural check only.
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

  // ── State ──────────────────────────────────────────────────────────────────

  // Four controlled fields — one state object keeps handleChange generic.
  const [fields, setFields] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // One error per field — undefined means "no error, show nothing".
  const [errors, setErrors] = useState<RegisterErrors>({});

  // Toggled to true after a valid submit so the success banner appears.
  const [submitted, setSubmitted] = useState(false);

  // ── handleChange ───────────────────────────────────────────────────────────
  //
  // Identical pattern to the login page.
  // `e.target.name` matches the `name` attribute on each input, which in turn
  // matches a key in `fields`, so one function covers all four inputs.
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;

    setFields((prev) => ({ ...prev, [name]: value }));

    // Clear this field's error as the user corrects it.
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  // ── handleSubmit ───────────────────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Build up all validation errors before setting state so every error
    // appears at once (not one after the next on repeated submits).
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

    // Cross-field validation: compare two fields against each other.
    // This kind of check is impossible with HTML's native `pattern` attribute
    // (which only validates one field in isolation) — it's one of the main
    // reasons we validate in JavaScript instead.
    if (fields.confirmPassword !== fields.password) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Valid — log and show the success banner.
    // The `confirmPassword` field is intentionally excluded from the log
    // because it's redundant once passwords have been verified to match.
    console.log("Register submitted:", {
      name: fields.name,
      email: fields.email,
      password: fields.password,
    });
    setSubmitted(true);
  }

  // ── Shared input class builder ──────────────────────────────────────────────
  //
  // A small helper to avoid repeating the long className string four times.
  // Returns the full className string for a given field, switching to red
  // borders when that field has a validation error.
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">

      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">

        {/* ── Heading ──────────────────────────────────────────────────────── */}
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold text-indigo-600">
            Soundwave
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Create an account</h1>
          <p className="mt-1 text-sm text-gray-500">
            Join Soundwave and start building your collection.
          </p>
        </div>

        {/* ── Success banner ───────────────────────────────────────────────── */}
        {submitted && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            Account created! Check the browser console for submitted data.
          </div>
        )}

        {/* ── Form ─────────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

          {/* ── Name field ─────────────────────────────────────────────────── */}
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

          {/* ── Email field ────────────────────────────────────────────────── */}
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

          {/* ── Password field ─────────────────────────────────────────────── */}
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
            {/* Hint text below the field (always shown, not an error) */}
            <p className="text-xs text-gray-400">Must be at least 6 characters.</p>
            {errors.password && (
              <p className="text-xs font-medium text-red-500">{errors.password}</p>
            )}
          </div>

          {/* ── Confirm password field ─────────────────────────────────────── */}
          {/* This field only exists to catch typos. Its value is never stored
              or sent to a server — we just compare it to `fields.password`. */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-gray-700"
            >
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

          {/* ── Submit button ──────────────────────────────────────────────── */}
          <button
            type="submit"
            className="mt-2 w-full rounded-full bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Create account
          </button>

        </form>

        {/* ── Switch link ──────────────────────────────────────────────────── */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Log in
          </Link>
        </p>

      </div>
    </main>
  );
}
