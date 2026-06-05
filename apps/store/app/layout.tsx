// layout.tsx — root layout for the store app.
//
// This is a Server Component (no "use client" directive).
// It wraps every page in the store with global providers.
//
// CHANGED from iteration 1:
//   Before: <UserProvider> held fake in-memory auth state (useState).
//   After:  <Providers> wraps with NextAuth's SessionProvider.
//           Real sessions come from the database; UserProvider is gone.
//
// The CartProvider stays — cart state is still held in memory for now.
// (Persistence to the CartItem DB table comes in a later iteration.)

import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/contexts/CartContext";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Soundwave Store",
  description: "Soundwave music store — browse and buy tracks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased">
        {/* Providers wraps with SessionProvider — required for useSession() in Client Components */}
        <Providers>
          {/* CartProvider gives every page access to the cart via useCart() */}
          <CartProvider>{children}</CartProvider>
        </Providers>
      </body>
    </html>
  );
}
