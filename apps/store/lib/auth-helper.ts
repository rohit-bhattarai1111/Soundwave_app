// auth-helper.ts — server-side session check for store Route Handlers.
//
// Any route that reads or writes per-user data (cart, orders) should call
// requireUser() first. It returns the userId on success, or a 401 response
// that the caller can return immediately.
//
// How it differs from the admin's requireAdmin():
//   requireUser  — just needs any valid session (the user is logged in)
//   requireAdmin — needs a session AND session.user.role === "ADMIN"
//
// Usage in any route handler:
//   const result = await requireUser();
//   if (result instanceof NextResponse) return result;   // 401 — stop here
//   const { userId } = result;                          // safe to proceed

import { auth } from "@repo/auth";
import { NextResponse } from "next/server";

// Return type: either a NextResponse (error) or the userId string (success).
// The `instanceof NextResponse` check in the caller acts as a type guard,
// narrowing the type to { userId: string } when access is allowed.
export async function requireUser(): Promise<{ userId: string } | NextResponse> {
  // auth() reads the encrypted session cookie from the request headers.
  // It's available in Route Handlers via Next.js's `next/headers` internals.
  const session = await auth();

  // No session or session has expired — return 401 Unauthorized.
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized. Please log in." },
      { status: 401 }
    );
  }

  // Session is valid — hand back the userId so the route can query the DB.
  return { userId: session.user.id };
}
