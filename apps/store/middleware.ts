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
// Why page-level protection instead of middleware?
//   NextAuth's `authorized` callback in middleware requires Edge-compatible
//   code. Our auth config imports Prisma (Node.js-only), so the authorized
//   callback cannot be used safely in Edge Runtime without a separate
//   edge-compatible auth config. Page-level auth() runs in Node.js runtime
//   and has no such restriction.
//
// The matcher still ensures the middleware runs on these paths so the session
// data is available to the page components via the request context.

export { auth as default } from "@repo/auth";

// config.matcher: which URL paths trigger this middleware.
// The patterns below match:
//   /cart           → the cart page
//   /cart/anything  → any sub-path of cart
//   /checkout       → checkout page
//   /orders         → order history page
// All other paths are NOT matched, so middleware never runs on the home page,
// /login, /register, or API routes.
export const config = {
  matcher: [
    "/cart/:path*",
    "/checkout/:path*",
    "/orders/:path*",
  ],
};
