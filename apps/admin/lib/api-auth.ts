// api-auth.ts — shared admin authorisation check for Route Handlers.
//
// Every admin API route must call this before doing any database work.
//
// How it works:
//   auth() (from @repo/auth / NextAuth v5) reads the encrypted session cookie
//   that the browser sends with every request. It either returns the session
//   object or null (expired / not logged in).
//
//   We perform two checks:
//     1. Authentication: is there a session at all? (is the user logged in?)
//     2. Authorisation:  is session.user.role === "ADMIN"? (do they have permission?)
//
//   This mirrors exactly what middleware.ts does at the routing layer — but Route
//   Handlers aren't covered by the matcher in middleware.ts (the "api/auth"
//   exclusion keeps NextAuth's own routes public), so we guard them here too.
//
// Usage in any route handler:
//   const authError = await requireAdmin();
//   if (authError) return authError;   // stop and send 401 or 403 to the client
//   // ... safe to proceed with DB work

import { auth } from "@repo/auth";
import { NextResponse } from "next/server";

// Returns a NextResponse (401 or 403) if the caller is not an admin.
// Returns null if the caller IS an admin — meaning "you may proceed".
export async function requireAdmin(): Promise<NextResponse | null> {
  // auth() is a server-only NextAuth helper. It reads the session from the
  // request's cookies via next/headers (available in Route Handlers since Next 13.4).
  const session = await auth();

  // Case 1: no session cookie, or the cookie has expired.
  // 401 Unauthorized — the client is not identified at all.
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // Case 2: valid session but user is a regular customer, not an admin.
  // 403 Forbidden — identity is known, but permission is denied.
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  // Passed both checks — return null to signal "all clear".
  return null;
}
