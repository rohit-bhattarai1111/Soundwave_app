// middleware.ts — Next.js Edge Middleware for the store app.
//
// Middleware runs BEFORE the page renders — if it redirects, the page never runs.
// This is more secure than protecting routes inside page.tsx.
//
// How it works with NextAuth v5:
//   Re-exporting `auth` as the default export turns NextAuth into the middleware.
//   NextAuth reads the session cookie, checks if the user is logged in,
//   and redirects to `pages.signIn` ("/login" in packages/auth/src/index.ts)
//   if they're not authenticated.
//
// The `matcher` in config LIMITS which paths this runs on — so only the three
// protected paths below ever trigger the auth check. Everything else (home page,
// register, API routes) is untouched.

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
