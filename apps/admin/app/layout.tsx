// layout.tsx — root layout for the admin app.
//
// CHANGED from iteration 1:
//   Before: <AuthProvider> held fake sessionStorage-based auth state.
//   After:  <Providers> wraps with NextAuth's SessionProvider.
//           The old AuthContext, verifyAdminLogin(), and ProtectedRoute are gone.
//           Protection is now handled by middleware.ts which runs BEFORE rendering.

import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { AdminShell } from "@/components/AdminShell";
// ProductsProvider was removed from layout — it now lives inside products/page.tsx
// (a Server Component) so it can receive real DB data as initialProducts.

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
      {/* overflow-hidden prevents a double scrollbar — the content area scrolls via overflow-y-auto */}
      <body className="overflow-hidden bg-slate-950 text-slate-900 antialiased">
        {/* Providers wraps the whole app in SessionProvider so useSession() works everywhere */}
        <Providers>
          {/* AdminShell renders the sidebar+header when authenticated, or just {children} on /login */}
          <AdminShell>
            {children}
          </AdminShell>
        </Providers>
      </body>
    </html>
  );
}
