// middleware.ts — Next.js Edge Middleware for the store app.
//
// This middleware enriches every matched request with session data from the
// JWT cookie (via NextAuth). It does NOT redirect unauthenticated users by
// itself — route protection happens at the page level instead:
//
//   /cart     → cart/page.tsx (server component) calls auth() + redirect()
//   /checkout → checkout/page.tsx (server component) calls auth() + redirect()
//   /orders   → orders/page.tsx (server component) calls auth() + redirect()
//
// WHY PAGE-LEVEL PROTECTION INSTEAD OF MIDDLEWARE?
//   NextAuth's `authorized` callback in middleware needs to run in Edge Runtime.
//   The full auth config (index.ts) imports Prisma and @libsql/client — Node.js-only
//   packages — so it cannot run in Edge Runtime. The edge-safe config exported by
//   "@repo/auth/middleware" can only verify the JWT; it cannot call the database.
//   Page-level auth() runs in Node.js runtime (server components) and has no such
//   restriction, so we do the actual DB-backed checks there.
//
// WHY "@repo/auth/middleware" NOT "@repo/auth"?
//   "@repo/auth" (packages/auth/src/index.ts) imports the Prisma adapter and
//   bcrypt — both pull in Node.js-only packages that crash in Edge Runtime.
//   "@repo/auth/middleware" (packages/auth/src/middleware.ts) only imports the
//   JWT config (config.ts), which is safe to run in Edge Runtime.

export { auth as default } from "@repo/auth/middleware";

// config.matcher: which URL paths trigger this middleware.
// We only match pages that need the session in their server component —
// the middleware stamps req.auth so the page can call auth() cheaply.
export const config = {
  matcher: [
    "/cart/:path*",
    "/checkout/:path*",
    "/orders/:path*",
  ],
};
