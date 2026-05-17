"use client";

import Link from "next/link";
import { useUser } from "@/contexts/UserContext";

export function NavbarAuthSection() {
  const { user, logout } = useUser();

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <span className="hidden text-sm font-medium text-gray-700 sm:block">
          {user.name}
        </span>
        <button
          onClick={logout}
          className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:border-red-300 hover:text-red-500"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/register"
        className="hidden text-sm font-medium text-gray-600 transition-colors hover:text-indigo-600 sm:block"
      >
        Register
      </Link>
      <Link
        href="/login"
        className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
      >
        Login
      </Link>
    </div>
  );
}
