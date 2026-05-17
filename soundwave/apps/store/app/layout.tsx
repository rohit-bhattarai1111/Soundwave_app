// layout.tsx is a special Next.js App Router file.
// It wraps EVERY page in this app — think of it as the "outer shell" that
// contains the <html> and <body> tags. Any component placed here (like a
// persistent sidebar or global toast notifications) would appear on all pages.

// Metadata is a Next.js type used to define the browser tab title and the
// description that search engines read. Exporting a `metadata` constant from
// a layout or page file is how Next.js handles SEO in App Router.
import type { Metadata } from "next";

// globals.css is imported here (not in individual pages) so Tailwind's base
// styles and utility classes load once for the whole app.
import "./globals.css";

// CartProvider wraps the whole app so every page and component can access the
// cart state via useCart() without receiving it as a prop.
// CartProvider is a "use client" component, but layout.tsx itself stays a
// server component — Next.js allows server components to render client components.
import { CartProvider } from "@/contexts/CartContext";

// UserProvider makes { user, login, logout } available to any component via
// useUser(). It wraps the same tree as CartProvider so both contexts are
// accessible everywhere — Navbar reads both (cart count + auth state).
import { UserProvider } from "@/contexts/UserContext";

// This metadata object populates the <title> and <meta name="description">
// tags in the page's <head> automatically — no need to write them manually.
export const metadata: Metadata = {
  title: "Soundwave Store",
  description: "Soundwave music store — browse and buy tracks",
};

// RootLayout receives `children` — whatever page or nested layout is being
// rendered — and wraps it inside the HTML skeleton.
// Readonly<{ children: React.ReactNode }> is TypeScript saying:
//   "children can be any valid React content (elements, strings, null…)
//    and this object is read-only — don't try to reassign children."
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // lang="en" helps screen readers and search engines identify the language.
    <html lang="en">
      {/* antialiased smooths font rendering on most screens.
          bg-white and text-gray-900 set the default background and text colour
          for every page — individual components can override these. */}
      {/* CartProvider makes { state, dispatch } available to any component
          inside this tree via the useCart() hook — no prop drilling needed. */}
      <body className="bg-white text-gray-900 antialiased">
        {/* UserProvider must wrap CartProvider (or vice versa — order doesn't
            matter) so both contexts are available to every child component. */}
        <UserProvider>
          <CartProvider>{children}</CartProvider>
        </UserProvider>
      </body>
    </html>
  );
}
