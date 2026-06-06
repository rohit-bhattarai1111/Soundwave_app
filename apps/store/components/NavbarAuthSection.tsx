"use client";

// NavbarAuthSection — shows login/logout based on the real NextAuth session.
//
// CHANGED from iteration 1:
//   Before: read from UserContext (fake useState).
//   After:  read from useSession() which reflects the httpOnly session cookie.
//           signOut() calls POST /api/auth/signout to delete the Session row
//           from the database AND clear the browser cookie.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export function NavbarAuthSection() {
  const router = useRouter();
  // useSession() reads the session from SessionProvider (set up in providers.tsx).
  // `status` is: "loading" | "authenticated" | "unauthenticated"
  // During loading (brief hydration moment), we render nothing to avoid a flash.
  const { data: session, status } = useSession();

  // Still fetching the session from the server — show nothing to avoid a flash
  // between "logged out" and "logged in" states on page load.
  if (status === "loading") return null;

  if (session) {
    // session.user comes from the session callback in packages/auth/src/index.ts.
    // It includes: id, name, email, role.
    const initial = session.user.name?.charAt(0).toUpperCase() ?? "U";

    return (
      <div className="flex items-center gap-3">

        {/* Avatar circle with the user's initial */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
          {initial}
        </div>

        {/* Full name visible on wider screens */}
        <span className="hidden text-sm font-medium text-gray-700 sm:block">
          {session.user.name}
        </span>

        {/* signOut() from next-auth/react: POSTs to /api/auth/signout.
            NextAuth deletes the Session row from the DB and clears the cookie.
            callbackUrl tells NextAuth where to redirect after sign-out. */}
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

  // Not logged in — show Register + Login links.
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
