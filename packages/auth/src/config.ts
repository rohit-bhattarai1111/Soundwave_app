import type { NextAuthConfig } from "next-auth";

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

export const authConfig = {
  session: { strategy: "jwt" } as const,
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = (user as { role?: string }).role ?? "USER";
      }
      return token;
    },
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
  pages: { signIn: "/login" },
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
