// ─── AuthContext.tsx ──────────────────────────────────────────────────────────
//
// CONCEPT: Why sessionStorage instead of localStorage?
//
// Both sessionStorage and localStorage store key-value strings in the browser.
// The critical difference is SCOPE:
//
//   localStorage    — persists until the user manually clears it (or code
//                     removes it). Survives closing the browser and reopening.
//
//   sessionStorage  — scoped to the current browser TAB. It is cleared when the
//                     tab is closed (or the browser crashes). Opening the admin
//                     in a new tab starts with a fresh, empty sessionStorage.
//
// For an admin dashboard this is the safer choice: if someone walks away from
// a shared computer and closes the tab, the session is gone automatically.
// localStorage would keep them "logged in" indefinitely.
//
// In iteration 2, sessionStorage is replaced with an HTTP-only cookie that the
// server sets — JavaScript can't read it at all, which makes it immune to XSS.

"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { verifyAdminLogin } from "@/lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminUser {
  email: string;
}

interface AuthContextValue {
  // isLoading is true until useEffect has checked sessionStorage.
  // Components should wait for loading to finish before redirecting.
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AdminUser | null;
  // Returns true on success, false when credentials are wrong.
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Key used to persist the logged-in user in sessionStorage.
const SESSION_KEY = "admin_auth";

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  // isLoading stays true until useEffect has run and checked sessionStorage.
  // This prevents ProtectedRoute from redirecting to /login on a page refresh
  // before we've had a chance to restore the previous session.
  const [isLoading, setIsLoading]   = useState(true);
  const [user,      setUser]        = useState<AdminUser | null>(null);

  // ── Restore session on mount ────────────────────────────────────────────────
  //
  // useEffect runs once after the component first renders in the browser.
  // sessionStorage is a browser API — it doesn't exist on the server — so this
  // is the earliest safe point to read it.
  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      // JSON.parse converts the stored string back to an AdminUser object.
      setUser(JSON.parse(stored) as AdminUser);
    }
    // Mark loading as done whether a session was found or not.
    setIsLoading(false);
  }, []); // [] = run once on mount, never re-run

  // ── login ───────────────────────────────────────────────────────────────────
  //
  // Called by the login form. Verifies credentials against the hardcoded values
  // in auth.ts, then persists the session to sessionStorage so a refresh keeps
  // the user logged in within the same tab.
  function login(email: string, password: string): boolean {
    if (!verifyAdminLogin(email, password)) return false;

    const adminUser: AdminUser = { email };
    setUser(adminUser);
    // JSON.stringify because sessionStorage only stores strings.
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(adminUser));
    return true;
  }

  // ── logout ──────────────────────────────────────────────────────────────────
  //
  // Clears React state AND sessionStorage so both are in sync.
  function logout() {
    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
  }

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isAuthenticated: user !== null,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── useAuth ──────────────────────────────────────────────────────────────────
//
// Custom hook — same pattern as useCart and useUser in the store app.
// Throws a descriptive error if called outside <AuthProvider>.
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
