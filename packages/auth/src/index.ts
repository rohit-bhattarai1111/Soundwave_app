// index.ts — shared NextAuth.js v5 configuration used by both apps.
//
// Both apps re-export the handlers via their own /api/auth/[...nextauth]/route.ts.
// This single file is the ONE place to change auth logic.
//
// SESSION STRATEGY CHANGE (from database → jwt):
//   Auth.js v5 enforces that the Credentials provider ONLY works with JWT sessions.
//   With an OAuth provider (Google, GitHub), the adapter creates a User row on first login
//   and links sessions to that row via the Session table.
//   With Credentials, the user already exists (registered via /api/auth/register) and
//   Auth.js has no standard way to link the Credentials response to an adapter User row
//   without the JWT intermediary — so it throws UnsupportedStrategy.
//
//   JWT sessions: the session cookie holds a signed+encrypted JSON token.
//     ✓ Works with Credentials provider
//     ✓ No DB query on every request (session data is in the cookie)
//     ✗ Cannot be revoked without a token blocklist
//   Database sessions: the cookie holds an opaque token; session row is in DB.
//     ✓ Revocable (delete the Session row)
//     ✗ Incompatible with Credentials provider in Auth.js v5
//
// How JWT callbacks work:
//   authorize()  →  jwt({ token, user })  →  session({ session, token })
//   The jwt callback runs first and puts data INTO the token.
//   The session callback runs second and shapes what pages/hooks see.

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcryptjs from "bcryptjs";
import { db } from "@repo/db/client";

// ─── Module augmentation ──────────────────────────────────────────────────────
// Extend NextAuth's built-in types so pages see .id and .role without casting.

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

// ─── NextAuth initialisation ──────────────────────────────────────────────────

export const { handlers, auth, signIn, signOut } = NextAuth({

  // The Prisma adapter is kept so OAuth providers (added later) still work
  // and so the Account table is populated correctly.
  adapter: PrismaAdapter(db),

  // JWT strategy: session data lives in an encrypted cookie, no DB lookup per request.
  // Required when using the Credentials provider with Auth.js v5.
  session: { strategy: "jwt" },

  providers: [
    Credentials({
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },

      // authorize() runs server-side on every login attempt.
      // Returns the user object (success) or null (wrong credentials).
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

  callbacks: {
    // jwt() — runs when a token is CREATED (sign-in) and every time it's READ.
    // `user` is only populated on the first call (the sign-in), so we use it
    // to put id and role into the token. Subsequent calls just pass the token through.
    async jwt({ token, user }) {
      if (user) {
        // user is the object returned by authorize() above.
        token.id   = user.id;
        token.role = (user as { role?: string }).role ?? "USER";
      }
      return token;
    },

    // session() — runs when auth() or useSession() is called.
    // With JWT strategy, `token` is the JWT payload (from the jwt callback above).
    // We copy id and role from the token into session.user so pages can read them.
    session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id:   token.id   as string,
          role: token.role as string ?? "USER",
        },
      };
    },
  },

  pages: { signIn: "/login" },

  // Give each app its own session cookie name so they don't share sessions on localhost.
  // On localhost, cookies are scoped by domain only (not port) — without this, logging
  // into admin (:3001) also logs you into the store (:3000) because both share "localhost".
  // In production (separate domains) this is not needed, but it's harmless to keep.
  // Each app sets AUTH_COOKIE_NAME in its own .env.local.
  ...(process.env.AUTH_COOKIE_NAME && {
    cookies: {
      sessionToken: {
        name: process.env.AUTH_COOKIE_NAME,
        options: {
          httpOnly: true,
          sameSite: "lax",
          path:     "/",
          secure:   process.env.NODE_ENV === "production",
        },
      },
    },
  }),
});
