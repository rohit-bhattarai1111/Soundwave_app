// POST /api/checkout
//
// Handles the checkout transaction in one step:
//   1. Read the user's cart from the DB
//   2. Validate stock for every item
//   3. DB TRANSACTION: create Order (PAID) + OrderItems + decrement stock + clear cart
//   4. Return { orderId } to the browser
//
// WHY A DB TRANSACTION?
//   All five operations (order, items, stock decrements, cart clear) must either
//   ALL succeed or ALL be rolled back. If stock decrement fails for one product,
//   we don't want a half-created order with some items missing. The transaction
//   guarantees atomicity — the database equivalent of "all or nothing".
//
// WHY DOES THE SERVER CALCULATE THE TOTAL?
//   The client sends nothing about amounts. The server reads prices directly from
//   the DB. A malicious user can't send { total: 1 } to pay $0.01 for everything.
//
// WHY IS STATUS SET TO "PAID" IMMEDIATELY?
//   With a real payment processor (like Stripe), the order is created as PENDING
//   and only marked PAID after the payment is confirmed via webhook. Here we have
//   a mock checkout with no real payment, so we set PAID immediately on submit.

import { NextResponse } from "next/server";
import { db } from "@repo/db/client";
import { requireUser } from "@/lib/auth-helper";

export async function POST() {
  // requireUser reads the session cookie and returns { userId } or a 401 response.
  const result = await requireUser();
  if (result instanceof NextResponse) return result;
  const { userId } = result;

  // ── Step 1: Read the user's cart from the DB ──────────────────────────────
  // include: { product: true } joins the Product table so we get the current
  // DB price for each cart item — never trust prices sent from the browser.
  const cartItems = await db.cartItem.findMany({
    where:   { userId },
    include: { product: true },
  });

  if (cartItems.length === 0) {
    return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
  }

  // Calculate total from DB prices.
  // priceInCents: e.g. 999 = $9.99. Storing as integer avoids floating-point bugs.
  const totalCents = cartItems.reduce(
    (sum, ci) => sum + ci.product.priceInCents * ci.quantity,
    0
  );

  // ── Step 2: DB transaction ─────────────────────────────────────────────────
  // db.$transaction(async tx => ...) wraps everything in a single SQL transaction.
  // If anything inside throws, Prisma automatically rolls back all changes.
  // "tx" is a Prisma client scoped to this transaction — use it for every DB call
  // inside the block so they all participate in the same transaction.
  let orderId: string;

  try {
    const order = await db.$transaction(async (tx) => {
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

      // 2b. Create the Order row with status PAID.
      //     This is a mock checkout — no real payment is involved, so we skip
      //     the PENDING → PAID transition that a real payment webhook would do.
      const createdOrder = await tx.order.create({
        data: {
          userId,
          totalCents,
          status: "PAID",
          items: {
            // Nested create: one OrderItem per cart item.
            // unitPriceCents snapshots the price NOW — if the price changes
            // later, the order history still shows what was charged at purchase.
            create: cartItems.map((ci) => ({
              productId:      ci.productId,
              quantity:       ci.quantity,
              unitPriceCents: ci.product.priceInCents,
            })),
          },
        },
        select: { id: true }, // only need the id for the response
      });

      // 2c. Decrement stockQty for each product that was purchased.
      //     Inside the transaction, so a failed decrement rolls back the order.
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

    orderId = order.id;

  } catch (err: unknown) {
    // The transaction rolled back — everything is as it was before the request.
    const message = err instanceof Error ? err.message : "Checkout failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Return orderId to the browser.
  // The checkout page stores this in sessionStorage for the success page summary.
  return NextResponse.json({ orderId });
}
