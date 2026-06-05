// GET /api/orders/mine — fetch the current user's order history.
//
// Why "mine" instead of /api/orders/[userId]?
//   With /api/orders/[userId], every request handler MUST verify that
//   params.userId === session.user.id to prevent one user from reading
//   another user's orders (IDOR — Insecure Direct Object Reference).
//   It's easy to forget that check, and forgetting it is a security bug.
//
//   With /api/orders/mine, there's no userId in the URL at all.
//   The userId is always taken from the session — it's structurally impossible
//   for a client to request a different user's orders.
//
// Prisma include: { items: { include: { product: true } } }:
//   This fetches Order → OrderItems → Product in a single SQL query tree.
//   Each order has an `items` array, and each item has a `product` object.
//   Equivalent SQL: SELECT orders.*, order_items.*, products.*
//                   FROM orders
//                   JOIN order_items ON order_items.orderId = orders.id
//                   JOIN products    ON products.id = order_items.productId
//                   WHERE orders.userId = ?

import { NextResponse } from "next/server";
import { db } from "@repo/db/client";
import { requireUser } from "@/lib/auth-helper";

export async function GET() {
  const result = await requireUser();
  if (result instanceof NextResponse) return result;
  const { userId } = result;

  const orders = await db.order.findMany({
    where:   { userId },
    include: {
      items: {
        include: {
          product: true,   // join OrderItem → Product so we have title, artist, etc.
        },
      },
    },
    orderBy: { createdAt: "desc" },  // newest orders first
  });

  // Map Prisma output to a clean JSON shape for the client.
  // Dates must be serialised to ISO strings (Prisma returns Date objects).
  const mapped = orders.map((order) => ({
    id:         order.id,
    status:     order.status,
    totalCents: order.totalCents,
    createdAt:  order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      productId:      item.productId,
      title:          item.product.title,
      artist:         item.product.artist,
      quantity:       item.quantity,
      unitPriceCents: item.unitPriceCents,
    })),
  }));

  return NextResponse.json(mapped);
}
