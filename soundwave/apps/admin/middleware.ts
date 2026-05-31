// middleware.ts — Next.js Edge Middleware for the admin app.
//
// The admin panel has TWO layers of protection (authentication + authorisation):
//   1. Authentication: is there a valid session? (user is logged in)
//   2. Authorisation:  does session.user.role === "ADMIN"? (user has the right role)
//
// Authentication = "Who are you?"  → verifying identity
// Authorisation  = "Are you allowed?" → verifying permission
//
// Both checks happen here, before the page component ever runs.
// middleware.ts is the server's front door.

import { auth } from "@repo/auth";
import { NextResponse } from "next/server";
import type { NextMiddleware } from "next/server";

// auth(callback) wraps our middleware with NextAuth's session-injection logic.
// Before our callback runs, NextAuth reads the session cookie and attaches
// the session to req.auth. If the cookie is invalid or expired, req.auth is null.
//
// `as unknown as NextMiddleware` is needed because `auth(callback)` returns
// an internal NextAuth type that references un-exported types. Casting to
// NextMiddleware (the standard Next.js middleware type) tells TypeScript
// the export is valid — the runtime behaviour is identical.
export default auth(function middleware(req) {
  // req.auth is injected by the auth() wrapper — it's the session or null.
  const session = req.auth as { user?: { role?: string } } | null;
  const { pathname } = req.nextUrl;

  // /login is always public — never redirect someone who is already on /login
  // (that would cause an infinite redirect loop).
  if (pathname === "/login") return NextResponse.next();

  // ── Check 1: is the user logged in? ──────────────────────────────────────
  if (!session) {
    // Build /login?callbackUrl=/products so after login, they land back here.
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Check 2: does the user have the ADMIN role? ───────────────────────────
  // A regular store customer (role "USER") who navigates to :3001 passes
  // check 1 but fails here. We redirect to /login?error=AccessDenied so the
  // login form can show "You don't have admin access."
  if (session.user?.role !== "ADMIN") {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("error", "AccessDenied");
    return NextResponse.redirect(loginUrl);
  }

  // Logged in AND is an admin — pass the request through.
  return NextResponse.next();
}) as unknown as NextMiddleware;
// ^ "as unknown as NextMiddleware" suppresses a TypeScript "inferred type cannot
//   be named" error caused by next-auth@beta exposing un-exported internal types.
//   The runtime behaviour is unaffected.

export const config = {
  matcher: [
    // Run on every path EXCEPT Next.js internals and NextAuth's own API routes.
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};
