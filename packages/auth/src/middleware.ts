// middleware.ts — edge-safe NextAuth export for use in Next.js Middleware.
//
// This file is the ONLY thing imported by apps' middleware.ts files.
// It creates a NextAuth instance using only authConfig (config.ts), which has
// zero Node.js-only dependencies — so it is safe to run in Edge Runtime.
//
// What this can do (Edge-safe):
//   ✓ Decrypt and verify the session JWT using AUTH_SECRET
//   ✓ Read user.id and user.role from the token payload
//   ✓ Redirect unauthenticated / unauthorised requests
//
// What this intentionally CANNOT do (Node.js only — see index.ts):
//   ✗ Query the database (no Prisma, no @libsql/client)
//   ✗ Hash or compare passwords (no bcrypt)
//   ✗ Handle login / sign-in flows (no Credentials provider)

import NextAuth from "next-auth";
import { authConfig } from "./config";

// Export only `auth` — handlers, signIn, signOut are Node.js-only and live in index.ts.
export const { auth } = NextAuth(authConfig);
