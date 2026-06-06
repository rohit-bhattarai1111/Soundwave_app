"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export function NavbarAuthSection() {
  const router = useRouter();
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (session) {
    const initial = session.user.name?.charAt(0).toUpperCase() ?? "U";

    return (
      <div className="flex items-center gap-3">

        <Link
          href="/orders"
          className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition-colors hover:border-indigo-300 hover:bg-indigo-100 sm:hidden"
        >
          My Orders
        </Link>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
          {initial}
        </div>

        <span className="hidden text-sm font-medium text-gray-700 sm:block">
          {session.user.name}
        </span>

        <button
          onClick={async () => {
            await signOut({ redirect: false });
            router.push("/");
            router.refresh();
          }}
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
