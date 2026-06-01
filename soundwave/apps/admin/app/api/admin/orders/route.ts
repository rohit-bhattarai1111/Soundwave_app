// GET /api/admin/orders — all orders across all users, with customer + item details.
//
// Admin-only: requireAdmin() returns 403 if the caller is not an ADMIN.
//
// This route exists for programmatic access (e.g. a future mobile admin app or
// external reporting tool). The admin orders page (app/orders/page.tsx) queries
// Prisma directly since it's a Server Component — no HTTP round-trip needed there.

import { NextResponse } from "next/server";
import { db } from "@repo/db/client";
import { requireAdmin } from "@/lib/api-auth";

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  // Fetch every order with:
  //   user  → customer name + email
  //   items → each OrderItem
  //     product → product title for the items list
  const orders = await db.order.findMany({
    include: {
      user:  true,          // JOIN Order → User (customer info)
      items: {
        include: {
          product: true,    // JOIN OrderItem → Product (product title/price)
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Map to a serialisable response shape.
  const mapped = orders.map((order) => ({
    id:         order.id,
    status:     order.status,
    totalCents: order.totalCents,
    createdAt:  order.createdAt.toISOString(),
    customer: {
      id:    order.user.id,
      name:  order.user.name,
      email: order.user.email,
    },
    itemCount: order.items.length,
    items: order.items.map((item) => ({
      title:          item.product.title,
      quantity:       item.quantity,
      unitPriceCents: item.unitPriceCents,
    })),
  }));

  return NextResponse.json(mapped);
}
