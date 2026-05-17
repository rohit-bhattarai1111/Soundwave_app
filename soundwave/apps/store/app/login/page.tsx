"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/contexts/UserContext";

// ─── Email regex ──────────────────────────────────────────────────────────────
// Loose structural check — full RFC 5321 validation is not worth it client-side.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoginErrors {
  email?: string;
  password?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const { login } = useUser();

  const [fields, setFields] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<LoginErrors>({});

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const newErrors: LoginErrors = {};

    if (!EMAIL_REGEX.test(fields.email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (fields.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // TODO iteration 2: replace with real API call
    console.log("Login submitted:", fields);
    login(fields.email.split("@")[0] ?? fields.email);
    router.push("/");
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
                errors.email
                  ? "border-red-400 focus:border-red-400"
                  : "border-gray-200 focus:border-indigo-400"
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
                errors.password
                  ? "border-red-400 focus:border-red-400"
                  : "border-gray-200 focus:border-indigo-400"
              }`}
            />
            {errors.password && (
              <p className="text-xs font-medium text-red-500">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-full bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Log in
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
