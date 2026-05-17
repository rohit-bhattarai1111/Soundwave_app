// ─── ProtectedRoute.tsx ───────────────────────────────────────────────────────
//
// CONCEPT: What does useEffect do here, and WHEN does it run?
//
// useEffect is React's way of running code that has a SIDE EFFECT — something
// that touches the world outside the component's render output (DOM reads,
// timers, API calls, navigation). React intentionally separates side effects
// from rendering.
//
// The sequence of events when a protected page loads:
//
//   1. Server renders the component HTML (no hooks run here — this is on Node.js,
//      not in the browser).
//   2. The browser receives the HTML and React "hydrates" it — attaches event
//      listeners and initialises React state.
//   3. The FIRST RENDER runs in the browser. At this point:
//        – isLoading = true (AuthProvider hasn't checked sessionStorage yet)
//        – We return null so nothing is visible.
//   4. useEffect inside AuthProvider fires, reads sessionStorage, and updates state.
//   5. This triggers a re-render of ProtectedRoute:
//        – If isLoading is now false and isAuthenticated is false → redirect.
//        – If isLoading is now false and isAuthenticated is true → show children.
//
// WHY can't we just call router.push() directly in the render function?
// Calling router.push() during render is a side effect — it changes the browser
// URL. React doesn't allow side effects during rendering because renders must be
// pure (same input → same output). useEffect is the designated escape hatch for
// running code after the render is committed to the DOM.

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { ReactNode } from "react";

// ─── Component ────────────────────────────────────────────────────────────────

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // ── Redirect effect ────────────────────────────────────────────────────────
  //
  // Runs after every render where isLoading or isAuthenticated changes.
  // The dependency array [isLoading, isAuthenticated, router] tells React
  // to re-run the effect only when those values change — not on every render.
  useEffect(() => {
    // Wait until AuthProvider has finished checking sessionStorage.
    // Without this guard, every page refresh would briefly redirect to /login
    // before the session is restored.
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // While loading or waiting for the redirect — render nothing so protected
  // content is never briefly visible to an unauthenticated user.
  if (isLoading || !isAuthenticated) return null;

  // Authenticated and done loading — show the protected page.
  return <>{children}</>;
}
