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
      {/* overflow-hidden prevents a double scrollbar — the content area scrolls via overflow-y-auto */}
      <body className="overflow-hidden bg-slate-950 text-slate-900 antialiased">
        <AuthProvider>
          <ProductsProvider>
            <AdminShell>
              {children}
            </AdminShell>
          </ProductsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
