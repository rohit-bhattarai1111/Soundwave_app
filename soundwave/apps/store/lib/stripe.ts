// stripe.ts — server-side Stripe client singleton.
//
// The Stripe Node.js SDK is used exclusively on the server (Route Handlers).
// It must NEVER be imported in "use client" components — the secret key would
// be bundled into the browser JavaScript and visible to anyone.
//
// We create a singleton (one instance for the whole server process) because:
//   - Stripe internally manages connection pools
//   - Creating a new Stripe() on every request wastes resources
//
// The environment variable is checked at import time so a missing key fails
// loudly at startup, not silently during the first real request.

import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error(
    "STRIPE_SECRET_KEY is not set. Add it to apps/store/.env.local"
  );
}

// apiVersion is pinned to the version the TypeScript types ship with.
// Changing it here requires also updating the package — Stripe ties TS types
// to specific API versions for type safety.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-02-24.acacia",
  typescript:  true,
});
