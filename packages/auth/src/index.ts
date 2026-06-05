// index.ts — full NextAuth.js v5 configuration (Node.js only).
//
// ⚠  DO NOT import this file from Next.js Middleware (middleware.ts).
//    It pulls in @repo/db/client which uses Prisma + @libsql/client — both are
//    Node.js-only and cannot run in Edge Runtime.
//    Middleware should import from "@repo/auth/middleware" instead.
//
// ─── HOW THE SPLIT CONFIG WORKS ──────────────────────────────────────────────
//
//   config.ts (edge-safe)  — JWT callbacks, pages, cookie settings.
//                            No DB or native addon imports.
//                            Used by middleware via "@repo/auth/middleware".
//
//   index.ts (this file)   — Extends authConfig with the Prisma adapter
//                            (user lookup for OAuth) and the Credentials provider
//                            (email + bcrypt password login).
//                            Used by API routes (/api/auth/[...nextauth]) and
//                            Server Components (auth() calls in page.tsx files).
//
// ─── SESSION STRATEGY ────────────────────────────────────────────────────────
//
//   Auth.js v5 requires jwt strategy when using the Credentials provider.
//   With database sessions, Auth.js would need to link the Credentials result to
//   an adapter session row — it has no standard mechanism for this and throws
//   UnsupportedStrategy. JWT sessions store identity in an encrypted cookie so
//   no database lookup is needed per request.
//
//   jwt   — session lives in a signed + encrypted cookie; fast, no DB per request;
//            cannot be revoked without a token blocklist.
//   db    — session row is in the database; revocable; incompatible with Credentials.

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcryptjs from "bcryptjs";
import { db } from "@repo/db/client";
import { authConfig } from "./config";

// Re-export the module augmentation so any file that imports from "@repo/auth"
// also sees the extended Session / User types without a separate import.
export type {} from "./config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Spread the edge-safe config (JWT strategy, callbacks, pages, cookie name).
  // We add only the Node.js-only pieces below.
  ...authConfig,

  // PrismaAdapter keeps the Account table in sync for OAuth providers added later.
  // It is NOT used for Credentials login — that goes through authorize() below.
  adapter: PrismaAdapter(db),

  providers: [
    Credentials({
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },

      // authorize() runs server-side on every login attempt.
      // Returns the user object on success, null on wrong credentials.
      async authorize(credentials): Promise<{ id: string; email: string; name: string; role: string } | null> {
        const email    = credentials?.email    as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!email || !password) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user) return null;

        const passwordMatch = await bcryptjs.compare(password, user.password);
        if (!passwordMatch) return null;

        // Return only safe fields — the password hash NEVER leaves the server.
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
});
