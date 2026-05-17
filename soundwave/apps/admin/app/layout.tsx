// ─── Admin Root Layout ────────────────────────────────────────────────────────
//
// CONCEPT: What does layout.tsx do?
//
// In Next.js App Router, a `layout.tsx` file wraps every page and nested layout
// BELOW it in the directory tree. The `children` prop is replaced by whatever
// page is currently being visited — the layout itself never unmounts or re-renders
// when you navigate between pages. Only the `children` slot swaps out.
//
// This makes layouts perfect for persistent chrome: sidebars, top bars, and
// anything that should stay mounted across route changes.
//
// WHY can the admin and store have completely different layouts?
// Because they are separate Next.js applications in separate directories.
// Each app has its own `app/layout.tsx` that is completely independent.
// They happen to share a monorepo and some configuration, but at runtime they
// are different servers on different ports — the store on 3000, admin on 3001.
// There is no shared layout between them; each defines its own from scratch.
//
// WHY is this file a server component even though auth state exists?
// layout.tsx itself stays a server component. The auth-aware UI decisions
// (show sidebar? show login page full-screen?) happen inside <AdminShell>,
// which is a client component. The server component only has to wrap children
// in the two providers — AuthProvider and AdminShell — which is purely structural.

import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProductsProvider } from "@/contexts/ProductsContext";
import { AdminShell } from "@/components/AdminShell";

export const metadata: Metadata = {
  title: "Soundwave Admin",
  description: "Soundwave admin dashboard — manage tracks and users",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* overflow-hidden on body prevents a double scrollbar — the inner
          content area handles its own scroll via overflow-y-auto. */}
      <body className="overflow-hidden bg-slate-950 text-slate-900 antialiased">

        {/* AuthProvider makes login/logout/isAuthenticated available to every
            client component in the tree via useAuth(). */}
        <AuthProvider>
          {/* ProductsProvider makes the products list and dispatch available to
              every client component — the products page, and any future widget
              that needs to read or modify the catalogue. */}
          <ProductsProvider>
            {/* AdminShell reads auth state and decides which layout to render:
                – loading:         null (avoids flash)
                – authenticated:   full sidebar + topbar
                – not auth'd:      bare children (for the /login full-screen page) */}
            <AdminShell>
              {children}
            </AdminShell>
          </ProductsProvider>
        </AuthProvider>

      </body>
    </html>
  );
}
