"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/contexts/UserContext";

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
  const { login } = useUser();

  const [fields, setFields] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<RegisterErrors>({});

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

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

    // TODO iteration 2: replace with real API call
    console.log("Register submitted:", {
      name: fields.name,
      email: fields.email,
      password: fields.password,
    });
    login(fields.name);
    router.push("/");
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

          <button
            type="submit"
            className="mt-2 w-full rounded-full bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Create account
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
