// ─── UserContext.tsx ──────────────────────────────────────────────────────────
//
// Manages the "who is logged in?" question for the whole store app.
//
// For now this is fully mocked — the user state lives in React memory
// (useState) and resets on every page refresh. In iteration 2 this will be
// replaced by a real authentication check (e.g. reading a session cookie or
// a JWT from an API), but the shape of the context and every component that
// reads it will stay exactly the same. That's the power of hiding auth behind
// a context: the rest of the app doesn't care where the user data comes from.

"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

// A logged-in user. Intentionally minimal for now — iteration 2 will add
// email, avatar URL, role, etc.
export interface User {
  name: string;
}

// What the context exposes to consumers.
// user === null means "nobody is logged in".
// user !== null means "this person is logged in".
interface UserContextValue {
  user: User | null;
  // login() will be called from the /login page once real auth is wired up.
  // For now, it just stores the name in memory.
  login: (name: string) => void;
  // logout() clears the user — the Navbar Logout button calls this directly.
  logout: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const UserContext = createContext<UserContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function UserProvider({ children }: { children: ReactNode }) {
  // null = logged out. A User object = logged in.
  // This useState is the only auth state the whole app reads from.
  const [user, setUser] = useState<User | null>(null);

  function login(name: string) {
    setUser({ name });
  }

  function logout() {
    setUser(null);
  }

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

// ─── useUser hook ─────────────────────────────────────────────────────────────

export function useUser(): UserContextValue {
  const context = useContext(UserContext);

  if (context === undefined) {
    throw new Error("useUser must be used inside a <UserProvider>.");
  }

  return context;
}
