"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { ReactNode } from "react";

// ─── Component ────────────────────────────────────────────────────────────────

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until AuthProvider has finished checking sessionStorage before
    // redirecting — without this, a page refresh always briefly redirects to /login.
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) return null;

  return <>{children}</>;
}
