import { NextResponse } from "next/server";
import { db } from "@repo/db/client";
import { getEffectivePriceInCents } from "@repo/db/pricing";
import { requireUser } from "@/lib/auth-helper";

export async function POST() {
  const result = await requireUser();
  if (result instanceof NextResponse) return result;
  const { userId } = result;

  const cartItems = await db.cartItem.findMany({
    where:   { userId },
    include: { product: true },
  });

  if (cartItems.length === 0) {
    return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
  }

  const totalCents = cartItems.reduce(
    (sum, ci) => sum + getEffectivePriceInCents(ci.product) * ci.quantity,
    0
  );

  let orderId: string;

  try {
    const order = await db.$transaction(async (tx) => {
      for (const ci of cartItems) {
        if (ci.product.stockQty < ci.quantity) {
          throw new Error(
            `"${ci.product.title}" only has ${ci.product.stockQty} in stock (you requested ${ci.quantity}).`
          );
        }
      }

      const createdOrder = await tx.order.create({
        data: {
          userId,
          totalCents,
          status: "PAID",
          items: {
            create: cartItems.map((ci) => ({
              productId:      ci.productId,
              quantity:       ci.quantity,
              unitPriceCents: getEffectivePriceInCents(ci.product),
            })),
          },
        },
        select: { id: true },
      });

      for (const ci of cartItems) {
        await tx.product.update({
          where: { id: ci.productId },
          data:  { stockQty: { decrement: ci.quantity } },
        });
      }

      await tx.cartItem.deleteMany({ where: { userId } });

      return createdOrder;
    });

    orderId = order.id;

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Checkout failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json({ orderId });
}
