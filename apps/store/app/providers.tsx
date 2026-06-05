"use client";

// providers.tsx — wraps all children in the SessionProvider from NextAuth.
//
// Why a separate file?
// layout.tsx is a Server Component (no "use client" directive). SessionProvider
// is a Client Component that uses React context internally. You can't import a
// Client Component into a Server Component directly as the root provider — you
// need a Client Component boundary. This small file IS that boundary.
//
// layout.tsx (Server) → <Providers> (Client, this file) → rest of the app

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  // SessionProvider stores the session in React context.
  // Any Client Component inside can call useSession() to read it without
  // making an extra network request per component.
  return <SessionProvider>{children}</SessionProvider>;
}
