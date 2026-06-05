// config.ts — edge-safe NextAuth configuration.
//
// WHY THIS FILE EXISTS (the "split config" pattern):
// ────────────────────────────────────────────────────
// Next.js Middleware runs in the Edge Runtime — a lightweight V8 sandbox that
// intentionally excludes Node.js APIs (no `fs`, no native addons, no `eval`).
//
// Both apps' middleware.ts files import `auth` from @repo/auth to read the
// session JWT on every request.  If the full auth config (index.ts) is imported,
// it pulls in:
//   @repo/db/client  →  @libsql/client  →  libsql (native Rust .node addon)
//                   →  bcryptjs (pure JS, but irrelevant at middleware time)
//
// Native addons cannot run in Edge Runtime, so the build fails with:
//   "Dynamic Code Evaluation not allowed in Edge Runtime"
//   "PrismaClient failed to initialize … not configured for this environment"
//
// SOLUTION: split the NextAuth config into two tiers:
//
//   config.ts    (this file) — Edge-safe. Only JWT shape + UI settings.
//                              No DB access, no bcrypt, no native packages.
//                              Imported by middleware.ts (Edge Runtime).
//
//   index.ts                — Node.js-only. Extends authConfig with the Prisma
//                              adapter (DB access) and the Credentials provider
//                              (bcrypt password check). Imported only by API
//                              routes and Server Components (Node.js runtime).
//
// The middleware only needs to VERIFY the JWT (is it valid? what is the role?).
// It does NOT need to know HOW users authenticate — that is Credentials' job.
// JWT verification is handled by NextAuth internally using the AUTH_SECRET env var.

import type { NextAuthConfig } from "next-auth";

// ─── Module augmentation ──────────────────────────────────────────────────────
// Extend NextAuth's built-in types so pages see .id and .role without type casts.
// Declared here (not in index.ts) so the middleware path also gets them.

declare module "next-auth" {
  interface User {
    role?: string;
  }
  interface Session {
    user: {
      id:     string;
      role:   string;
      name:   string;
      email:  string;
      image?: string | null;
    };
  }
}

// authConfig is intentionally minimal — it only describes how JWT tokens are
// shaped and where the login page lives.  providers[] is empty here because
// the Credentials provider (which needs bcrypt + DB) is added in index.ts.
export const authConfig = {
  // JWT strategy: the session lives in an encrypted cookie.
  // No database lookup is needed to verify a request — NextAuth decrypts the
  // cookie with AUTH_SECRET and the user's identity is read from the payload.
  // This is also why the Credentials provider requires JWT (see index.ts).
  session: { strategy: "jwt" } as const,

  // Empty here — Credentials provider is added in index.ts (Node.js only).
  providers: [],

  callbacks: {
    // jwt() runs when a token is CREATED (sign-in) and every time it is READ
    // (any protected page load, middleware check).
    // `user` is only present on the initial sign-in — we use it to stamp
    // id and role into the token so they survive across requests.
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = (user as { role?: string }).role ?? "USER";
      }
      return token;
    },

    // session() transforms the raw token into what auth() / useSession() return.
    // We copy id and role from the token so page components can read them
    // without an extra DB query.
    session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id:   token.id   as string,
          role: (token.role as string) ?? "USER",
        },
      };
    },
  },

  // Redirect unauthenticated users to /login.
  pages: { signIn: "/login" },

  // Give each app its own session cookie name so store and admin don't share
  // sessions when both run on localhost (cookies are domain-scoped, not port-scoped).
  // AUTH_COOKIE_NAME is set per-app in .env.local.  Environment variables are
  // available in Edge Runtime — they're just strings, no Node.js API involved.
  ...(process.env.AUTH_COOKIE_NAME && {
    cookies: {
      sessionToken: {
        name: process.env.AUTH_COOKIE_NAME,
        options: {
          httpOnly: true,
          sameSite: "lax" as const,
          path:     "/",
          secure:   process.env.NODE_ENV === "production",
        },
      },
    },
  }),
} satisfies NextAuthConfig;
