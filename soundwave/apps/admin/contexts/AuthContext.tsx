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
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AdminUser | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const SESSION_KEY = "admin_auth";

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  // isLoading stays true until sessionStorage is read — prevents a redirect
  // flash on page refresh before the previous session is restored.
  const [isLoading, setIsLoading] = useState(true);
  const [user,      setUser]      = useState<AdminUser | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      setUser(JSON.parse(stored) as AdminUser);
    }
    setIsLoading(false);
  }, []);

  function login(email: string, password: string): boolean {
    if (!verifyAdminLogin(email, password)) return false;

    const adminUser: AdminUser = { email };
    setUser(adminUser);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(adminUser));
    return true;
  }

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

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
