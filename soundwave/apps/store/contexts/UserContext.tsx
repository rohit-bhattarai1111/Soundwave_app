"use client";

// TODO iteration 2: replace useState with session cookie / API auth check

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  name: string;
}

interface UserContextValue {
  user: User | null;
  login: (name: string) => void;
  logout: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const UserContext = createContext<UserContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  function login(name: string) { setUser({ name }); }
  function logout() { setUser(null); }

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

// ─── useUser ──────────────────────────────────────────────────────────────────

export function useUser(): UserContextValue {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used inside a <UserProvider>.");
  }
  return context;
}
