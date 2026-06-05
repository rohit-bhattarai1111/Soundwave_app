// route.ts — NextAuth.js v5 catch-all route handler for the store app.
//
// The [...nextauth] folder name means this file handles every URL that starts
// with /api/auth/ — for example:
//   POST /api/auth/callback/credentials  ← called when the login form submits
//   GET  /api/auth/session               ← called by useSession() to refresh session data
//   POST /api/auth/signout               ← called when signOut() is invoked
//
// All auth logic lives in packages/auth/src/index.ts — this file is just a
// thin connector. Both apps share the same Prisma adapter, Credentials provider,
// and session callbacks; only the mount point differs.

import { handlers } from "@repo/auth";

// Next.js App Router requires named exports per HTTP method.
// `handlers` from NextAuth is { GET, POST } — we destructure and re-export them.
export const { GET, POST } = handlers;
