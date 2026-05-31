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
      {/* overflow-hidden prevents a double scrollbar — the content area scrolls via overflow-y-auto */}
      <body className="overflow-hidden bg-slate-950 text-slate-900 antialiased">
        {/* Providers wraps the whole app in SessionProvider so useSession() works everywhere */}
        <Providers>
          {/* ProductsProvider still uses mock data — will be replaced with DB in a later iteration */}
          <ProductsProvider>
            <AdminShell>
              {children}
            </AdminShell>
          </ProductsProvider>
        </Providers>
      </body>
    </html>
  );
}
