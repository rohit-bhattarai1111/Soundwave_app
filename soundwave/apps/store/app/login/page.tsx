// ─── /login page ──────────────────────────────────────────────────────────────
//
// CONCEPTS USED ON THIS PAGE:
//
// 1. CONTROLLED INPUT
//    A "controlled input" means React owns the value of every text field —
//    the input's `value` prop is wired to a piece of state, and the input can
//    only change by updating that state. This gives us a single source of truth:
//    at any moment, `fields.email` reflects exactly what the user has typed.
//
//    Uncontrolled input (the alternative): the browser owns the value and you
//    read it with a ref at submit time. Controlled is preferred for forms that
//    need real-time validation or conditional UI.
//
// 2. onChange EVENT
//    Every <input> fires an `onChange` event whenever the user types, pastes,
//    or deletes a character. React gives us a `React.ChangeEvent<HTMLInputElement>`
//    object. We read `e.target.name` (which field changed) and `e.target.value`
//    (the new text) to update state.
//
// 3. CLIENT-SIDE vs SERVER-SIDE VALIDATION
//    Client-side (this page): runs in the browser with JavaScript. It gives
//    instant feedback without a round-trip to the server — great for UX.
//    BUT it is not a security boundary: users can bypass it by disabling JS
//    or sending raw HTTP requests. Always re-validate on the server too.
//
//    Server-side (iteration 2): runs in an API route or server action before
//    the data touches the database. It's the authoritative check and cannot
//    be bypassed by the user.

"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Email regex ──────────────────────────────────────────────────────────────
// Checks for the basic pattern: something @ something . something
// It's intentionally loose — full RFC 5321 email validation is very complex
// and usually not worth it on the client side.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Types ────────────────────────────────────────────────────────────────────

// Optional fields — a missing key means "no error for this field".
interface LoginErrors {
  email?: string;
  password?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginPage() {

  // ── State ──────────────────────────────────────────────────────────────────
  //
  // `fields` holds the current value of every input.
  // We use one object (not two separate useState calls) so we can handle every
  // field with a single, generic handleChange function.
  const [fields, setFields] = useState({ email: "", password: "" });

  // `errors` holds any validation messages keyed by field name.
  // When an error is undefined, no message is shown for that field.
  const [errors, setErrors] = useState<LoginErrors>({});

  // `submitted` becomes true after a successful submit so we can show the
  // success banner without navigating away (no real auth yet).
  const [submitted, setSubmitted] = useState(false);

  // ── handleChange ───────────────────────────────────────────────────────────
  //
  // This single function handles ALL inputs. It works because each <input>
  // has a `name` attribute that matches the corresponding key in `fields`.
  //
  // e.target.name  → which field changed ("email" or "password")
  // e.target.value → what the user typed
  //
  // We also clear that field's error immediately, so the red message disappears
  // as soon as the user starts correcting their input — better UX than waiting
  // for them to re-submit.
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;

    // Spread the old fields, overwrite only the one that changed.
    setFields((prev) => ({ ...prev, [name]: value }));

    // Clear the error for this field (if any) so it disappears while typing.
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  // ── handleSubmit ───────────────────────────────────────────────────────────
  //
  // Called when the <form> fires its submit event (button click or Enter key).
  // e.preventDefault() stops the browser's default behaviour, which would be
  // to reload the page and send the data as a GET/POST request — we don't want
  // that; we handle the data ourselves.
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Collect all validation failures into one object before setting state.
    // This way, all errors appear at once instead of one-at-a-time.
    const newErrors: LoginErrors = {};

    if (!EMAIL_REGEX.test(fields.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (fields.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    // If anything failed, show the errors and stop here.
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // All fields are valid — log the data and show success.
    // In iteration 2 this will be replaced by an API call or server action.
    console.log("Login submitted:", fields);
    setSubmitted(true);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    // Full-screen centred layout — flex column to stack the card on small screens.
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">

      {/* Card container — same rounded-2xl + shadow-sm style used across the app */}
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">

        {/* ── Heading ──────────────────────────────────────────────────────── */}
        <div className="mb-8 text-center">
          {/* Logo mark — clicking returns to home */}
          <Link href="/" className="text-2xl font-bold text-indigo-600">
            Soundwave
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sign in to your account to continue.
          </p>
        </div>

        {/* ── Success banner ───────────────────────────────────────────────── */}
        {/* Only rendered after a successful submit. The form stays on screen
            so the user can see their submitted values (helpful while learning). */}
        {submitted && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            Logged in! Check the browser console for submitted data.
          </div>
        )}

        {/* ── Form ─────────────────────────────────────────────────────────── */}
        {/* onSubmit on the <form> element — fires when the user clicks the
            submit button OR presses Enter in any field. */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          {/* noValidate disables the browser's built-in validation popups so
              our custom inline messages are the only ones that show. */}

          {/* ── Email field ────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-sm font-medium text-gray-700"
            >
              Email address
            </label>

            {/* CONTROLLED INPUT:
                value={fields.email}      ← React controls what's displayed
                onChange={handleChange}   ← React updates state on every keystroke
                name="email"             ← handleChange uses this to know which field changed */}
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={fields.email}
              onChange={handleChange}
              // Conditionally add red border when there's a validation error.
              className={`w-full rounded-lg border px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-100 ${
                errors.email
                  ? "border-red-400 focus:border-red-400"
                  : "border-gray-200 focus:border-indigo-400"
              }`}
            />

            {/* Error message — only rendered when errors.email is defined */}
            {errors.email && (
              <p className="text-xs font-medium text-red-500">{errors.email}</p>
            )}
          </div>

          {/* ── Password field ─────────────────────────────────────────────── */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
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
                errors.password
                  ? "border-red-400 focus:border-red-400"
                  : "border-gray-200 focus:border-indigo-400"
              }`}
            />

            {errors.password && (
              <p className="text-xs font-medium text-red-500">{errors.password}</p>
            )}
          </div>

          {/* ── Submit button ──────────────────────────────────────────────── */}
          {/* type="submit" triggers the form's onSubmit when clicked */}
          <button
            type="submit"
            className="mt-2 w-full rounded-full bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Log in
          </button>

        </form>

        {/* ── Switch link ──────────────────────────────────────────────────── */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Register
          </Link>
        </p>

      </div>
    </main>
  );
}
