// POST /api/checkout
//
// This is the most important server-side route in the app.
// It does three things atomically:
//   1. DB TRANSACTION: create Order (PENDING) + OrderItems + decrement stock + clear cart
//   2. STRIPE: create a PaymentIntent with the order total
//   3. Return { clientSecret } to the browser
//
// Why a DB transaction?
//   All five DB operations (order, items, stock decrements, cart clear) must either
//   ALL succeed or ALL be rolled back. If stock decrement fails for one product,
//   we don't want a half-created order with some items missing. The transaction
//   guarantees this atomicity — it's the database equivalent of "all or nothing".
//
// Why create the order BEFORE taking payment?
//   We need an orderId to attach to the PaymentIntent as metadata. When Stripe
//   sends the webhook (payment_intent.succeeded), that orderId tells us which
//   order to mark as PAID. Without it, we'd have no way to link payment to order.
//
// Why does the server calculate the total?
//   The client sends nothing about amounts. The server reads prices directly from
//   the DB. A malicious user can't send { total: 1 } to pay $0.01 for everything.

import { NextResponse } from "next/server";
import { db } from "@repo/db/client";
import { stripe } from "@/lib/stripe";
import { requireUser } from "@/lib/auth-helper";

export async function POST() {
  const result = await requireUser();
  if (result instanceof NextResponse) return result;
  const { userId } = result;

  // ── Step 1: Read the user's cart from the DB ──────────────────────────────
  // include: { product: true } gives us the current DB price for each item.
  const cartItems = await db.cartItem.findMany({
    where:   { userId },
    include: { product: true },
  });

  if (cartItems.length === 0) {
    return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
  }

  // Calculate total from DB prices — never trust anything the client sends.
  const totalCents = cartItems.reduce(
    (sum, ci) => sum + ci.product.priceInCents * ci.quantity,
    0
  );

  // ── Step 2: DB transaction ─────────────────────────────────────────────────
  // db.$transaction(async tx => ...) wraps everything in a single SQL transaction.
  // If anything inside throws, Prisma automatically rolls back all changes.
  // "tx" is a Prisma client scoped to this transaction — use it for all DB calls
  // inside the block so they participate in the same transaction.
  let order: { id: string };

  try {
    order = await db.$transaction(async (tx) => {
      // 2a. Check stock availability for every item before committing.
      //     Within a transaction the read is isolated — no other transaction can
      //     change stock between our read and our decrement.
      for (const ci of cartItems) {
        if (ci.product.stockQty < ci.quantity) {
          throw new Error(
            `"${ci.product.title}" only has ${ci.product.stockQty} in stock (you requested ${ci.quantity}).`
          );
        }
      }

      // 2b. Create the Order row. Status is PENDING until Stripe confirms payment.
      //     stripePaymentIntentId is set in Step 3 (we need the orderId first).
      const createdOrder = await tx.order.create({
        data: {
          userId,
          totalCents,
          status: "PENDING",
          items: {
            // Nested create: one OrderItem per cart item.
            // unitPriceCents snapshots the price NOW — if the price changes
            // next week, the order history still shows what the customer paid.
            create: cartItems.map((ci) => ({
              productId:      ci.productId,
              quantity:       ci.quantity,
              unitPriceCents: ci.product.priceInCents,
            })),
          },
        },
        select: { id: true }, // only need the id for the next step
      });

      // 2c. Decrement stockQty for each product that was purchased.
      //     We do this inside the transaction so a failed decrement rolls back
      //     the entire order (no order without stock reduction).
      for (const ci of cartItems) {
        await tx.product.update({
          where: { id: ci.productId },
          data:  { stockQty: { decrement: ci.quantity } },
        });
      }

      // 2d. Clear the user's cart — they've committed to buying these items.
      await tx.cartItem.deleteMany({ where: { userId } });

      return createdOrder;
    });

  } catch (err: unknown) {
    // The transaction rolled back — everything is as it was before.
    const message = err instanceof Error ? err.message : "Checkout failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // ── Step 3: Create Stripe PaymentIntent ───────────────────────────────────
  // A PaymentIntent represents one payment attempt for a specific amount.
  // The client_secret it returns is safe to send to the browser — it lets
  // the client complete the payment but not read private data.
  //
  // metadata.orderId links this PaymentIntent back to our DB order.
  // The webhook handler reads it to know which order to mark PAID.
  let clientSecret: string;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount:   totalCents,
      currency: "aud",          // Australian dollars
      metadata: { orderId: order.id },
      // automatic_payment_methods lets Stripe show the payment methods
      // the customer's browser/card supports (card, Apple Pay, etc.).
      automatic_payment_methods: { enabled: true },
    });

    if (!paymentIntent.client_secret) {
      throw new Error("Stripe did not return a client_secret.");
    }

    clientSecret = paymentIntent.client_secret;

    // Save the PaymentIntent ID on the order so we can look it up later
    // (e.g. for refunds, or if the webhook arrives out of order).
    await db.order.update({
      where: { id: order.id },
      data:  { stripePaymentIntentId: paymentIntent.id },
    });

  } catch (err: unknown) {
    // Stripe API call failed — cancel the order so the user can retry.
    await db.order.update({
      where: { id: order.id },
      data:  { status: "CANCELLED" },
    });
    console.error("[POST /api/checkout] Stripe error:", err);
    return NextResponse.json(
      { error: "Payment setup failed. Please try again." },
      { status: 502 }
    );
  }

  // Return the clientSecret and orderId to the browser.
  // The browser uses clientSecret to complete the card payment via Stripe.js.
  // The orderId is stored for the success page display.
  return NextResponse.json({ clientSecret, orderId: order.id });
}
