import { NextResponse } from "next/server";
import { db } from "@repo/db/client";
import { requireAdmin } from "@/lib/api-auth";

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  const orders = await db.order.findMany({
    include: {
      user:  true,
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

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
