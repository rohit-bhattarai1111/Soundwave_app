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
