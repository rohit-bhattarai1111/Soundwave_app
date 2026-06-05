// cart/page.tsx — server-side auth guard for the shopping cart.
//
// The cart UI is a "use client" component (CartPageClient.tsx) because it
// needs CartContext hooks. This server component calls auth() BEFORE the
// client component renders, redirecting unauthenticated users to /login at
// the server level (no client-side flash, no middleware authorised callback
// needed in Edge Runtime).
//
// This mirrors the pattern already used by the /orders page.

import { auth } from "@repo/auth";
import { redirect } from "next/navigation";
import CartPageClient from "./CartPageClient";

export default async function CartPage() {
  // auth() reads the session cookie server-side — runs in Node.js runtime,
  // so Prisma and bcryptjs are fully available.
  const session = await auth();
  // No session → send the user to /login before any HTML is streamed.
  if (!session?.user?.id) redirect("/login");
  // Authenticated — delegate all UI logic to the client component.
  return <CartPageClient />;
}
