// index.ts — shared NextAuth.js v5 configuration used by both apps.
//
// Both apps re-export the handlers via their own /api/auth/[...nextauth]/route.ts.
// This single file is the ONE place to change auth logic — adding a Google provider,
// changing session duration, adding callbacks, etc.
//
// What each export is for:
//   handlers  → mount at /api/auth/[...nextauth] in each app
//   auth      → call in Server Components: const session = await auth()
//   signIn    → call in Server Actions or middleware to trigger sign-in
//   signOut   → call in Server Actions or middleware to trigger sign-out
//
// For CLIENT components (login forms, buttons) use next-auth/react instead:
//   signIn(), signOut(), useSession() — these are client-side wrappers.

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcryptjs from "bcryptjs";
import { db } from "@repo/db/client";

// ─── Module augmentation ──────────────────────────────────────────────────────
// NextAuth's built-in User and Session types don't include our custom fields
// (id and role). Augmenting the module adds them to every place these types
// are used in both apps — no casting needed.
//
// "declare module" only affects TypeScript types, never the JavaScript at runtime.

declare module "next-auth" {
  // Extend the User type — used by the session callback and adapter methods.
  interface User {
    // Allowed values: "USER" | "ADMIN" (matches schema.prisma allowed values).
    role?: string;
  }

  // Extend Session.user so pages can access session.user.id and session.user.role
  // without TypeScript complaining.
  interface Session {
    user: {
      id:    string;
      role:  string;
      name:  string;
      email: string;
      image?: string | null;
    };
  }
}

// ─── NextAuth initialisation ──────────────────────────────────────────────────
// NextAuth() returns four values we export. The configuration object passed to
// it defines everything: adapter, session strategy, providers, and callbacks.

export const { handlers, auth, signIn, signOut } = NextAuth({

  // ── Prisma adapter ────────────────────────────────────────────────────────
  // The adapter tells NextAuth how to read/write sessions using our database.
  // With the Prisma adapter:
  //   - Sessions are stored in the Session table (see schema.prisma)
  //   - Accounts are stored in the Account table (for OAuth providers)
  //   - Users are NOT created by NextAuth here — we create them via /api/auth/register
  adapter: PrismaAdapter(db),

  // ── Session strategy ──────────────────────────────────────────────────────
  // "database": the session cookie holds an opaque random token.
  //   On each request, NextAuth looks up that token in the Session table and
  //   fetches the associated User row.
  //   ✓ Sessions can be revoked immediately (delete the Session row)
  //   ✓ Changing a user's role takes effect on their next request (no stale JWT)
  //   ✗ Every authenticated request hits the database once
  //
  // "jwt" (alternative): the cookie holds a signed JSON token with user data baked in.
  //   Faster (no DB lookup), but cannot be revoked without a blocklist.
  session: { strategy: "database" },

  providers: [
    // ── Credentials provider ────────────────────────────────────────────────
    // Validates email + password against the User table.
    // Unlike OAuth providers, Credentials does NOT auto-create users —
    // users must register first via POST /api/auth/register.
    Credentials({
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },

      // authorize() runs SERVER-SIDE when the login form is submitted.
      // Must return a User object (success) or null (wrong email/password).
      // Returning null causes NextAuth to show the /login page with error=CredentialsSignin.
      async authorize(credentials): Promise<{ id: string; email: string; name: string; role: string } | null> {
        const email    = credentials?.email    as string | undefined;
        const password = credentials?.password as string | undefined;

        // Guard: both fields must be present (client validates too, but server is the real gate).
        if (!email || !password) return null;

        // findUnique never throws — returns null if no row matches.
        const user = await db.user.findUnique({ where: { email } });
        if (!user) return null;

        // bcryptjs.compare() re-derives the hash from the input password and compares
        // it to the stored hash. This takes ~100ms intentionally (cost factor = 10)
        // to make brute-force attacks slow.
        const passwordMatch = await bcryptjs.compare(password, user.password);
        if (!passwordMatch) return null;

        // Return only safe fields — the password hash NEVER leaves the server.
        return {
          id:    user.id,
          email: user.email,
          name:  user.name,
          role:  user.role,
        };
      },
    }),
  ],

  // ── Callbacks ─────────────────────────────────────────────────────────────
  callbacks: {
    // session() fires when auth() or useSession() is called on any request.
    // With the database strategy:
    //   - `user` is the row from the User table (fetched by the Prisma adapter).
    //   - `session` is the partial session object NextAuth builds internally.
    // We enrich session.user with id and role so every page can use them.
    session({ session, user }) {
      return {
        ...session,
        user: {
          ...session.user,
          id:   user.id,
          // The Prisma adapter returns all User fields. TypeScript needs the cast
          // because `user` is typed as NextAuth's `User` interface + augmentation;
          // the augmentation marks `role` as optional (string | undefined).
          role: (user as { id: string; role: string }).role ?? "USER",
        },
      };
    },
  },

  // Where to send users who aren't logged in when they hit a protected route.
  // Both apps have their login page at /login, so this works for both.
  pages: { signIn: "/login" },
});
