// checkout/page.tsx — server-side auth guard for the checkout page.
//
// The checkout UI is a "use client" component (CheckoutPageClient.tsx) because
// it needs CartContext hooks. This server component calls
// auth() BEFORE the client component renders, redirecting unauthenticated users
// to /login at the server level (no client-side flash).
//
// This mirrors the pattern used by the /orders and /cart pages.

import { auth } from "@repo/auth";
import { redirect } from "next/navigation";
import CheckoutPageClient from "./CheckoutPageClient";

export default async function CheckoutPage() {
  // auth() reads the session cookie server-side — runs in Node.js runtime,
  // so Prisma and bcryptjs are fully available.
  const session = await auth();
  // No session → send the user to /login before any HTML is streamed.
  if (!session?.user?.id) redirect("/login");
  // Authenticated — delegate all UI logic to the client component.
  return <CheckoutPageClient />;
}
