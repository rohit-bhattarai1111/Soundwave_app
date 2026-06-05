// POST /api/webhooks/stripe
//
// Stripe calls this endpoint AFTER a payment event occurs on their servers.
// We NEVER mark an order as paid based on what the client tells us —
// we only trust Stripe's server-to-server webhook with a verified signature.
//
// Why signature verification?
//   Without it, anyone could POST { type: "payment_intent.succeeded", ... }
//   to this URL and get orders marked as PAID without paying anything.
//   The webhook secret (STRIPE_WEBHOOK_SECRET) is shared only between Stripe
//   and your server. Stripe signs each webhook payload with HMAC-SHA256 using
//   that secret. stripe.webhooks.constructEvent() verifies the signature —
//   if it fails, the payload was tampered with or didn't come from Stripe.
//
// Local testing with the Stripe CLI:
//   stripe login
//   stripe listen --forward-to localhost:3000/api/webhooks/stripe
//   The CLI prints a whsec_... secret — put it in STRIPE_WEBHOOK_SECRET.
//   Then, in another terminal, trigger test events:
//     stripe trigger payment_intent.succeeded

import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@repo/db/client";

// The webhook secret is set when you configure the endpoint in the Stripe dashboard
// or printed by `stripe listen` during local development.
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set.");
    return NextResponse.json(
      { error: "Webhook secret not configured." },
      { status: 500 }
    );
  }

  // CRITICAL: read the raw request body as a string, not parsed JSON.
  // stripe.webhooks.constructEvent() needs the exact raw bytes that Stripe sent
  // to compute and verify the HMAC signature. If we parse it as JSON first,
  // whitespace/ordering changes break the signature check.
  const rawBody = await req.text();

  // The Stripe-Signature header contains the timestamp + signature that
  // Stripe attached when it sent this request.
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json(
      { error: "Missing Stripe-Signature header." },
      { status: 400 }
    );
  }

  // ── Verify the webhook signature ─────────────────────────────────────────
  // constructEvent() throws if:
  //   - The signature doesn't match (tampered payload)
  //   - The timestamp is too old (replay attack protection, default: 5 minutes)
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[Stripe webhook] Signature verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // ── Handle events ─────────────────────────────────────────────────────────
  // Only handle the events we care about; ignore everything else with 200 OK.
  // (Stripe expects 200 responses — non-200 triggers retries.)

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    // The orderId was stored in metadata when we created the PaymentIntent
    // in POST /api/checkout. This links Stripe's payment back to our DB order.
    const orderId = paymentIntent.metadata?.orderId;

    if (!orderId) {
      console.error("[Stripe webhook] payment_intent.succeeded missing orderId in metadata");
      // Return 200 anyway — Stripe shouldn't retry this (it's our data problem, not Stripe's).
      return NextResponse.json({ received: true });
    }

    // Mark the order as PAID. This is the ONLY place orders are marked PAID —
    // never on the client, never in the checkout form handler.
    await db.order.update({
      where: { id: orderId },
      data:  { status: "PAID" },
    });

    console.log(`[Stripe webhook] Order ${orderId} marked PAID`);
  }

  // Other events we might add later:
  //   payment_intent.payment_failed → mark order CANCELLED, notify user
  //   charge.refunded               → mark order REFUNDED

  // Acknowledge receipt to Stripe. If we return non-200, Stripe will retry
  // the webhook multiple times over the next 24 hours.
  return NextResponse.json({ received: true });
}
