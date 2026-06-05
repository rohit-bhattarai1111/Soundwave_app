"use client";

// providers.tsx — same SessionProvider boundary pattern as apps/store.
// See apps/store/app/providers.tsx for the full explanation.

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
