import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
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
      <body className="overflow-hidden bg-slate-950 text-slate-900 antialiased">
        <Providers>
          <AdminShell>
            {children}
          </AdminShell>
        </Providers>
      </body>
    </html>
  );
}
