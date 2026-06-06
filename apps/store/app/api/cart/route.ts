import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@repo/db/client";
import { getEffectivePriceInCents } from "@repo/db/pricing";
import { requireUser } from "@/lib/auth-helper";

const AddToCartSchema = z.object({
  productId: z.string().min(1, "productId is required."),
});

export async function GET() {
  const result = await requireUser();
  if (result instanceof NextResponse) return result;
  const { userId } = result;

  const cartItems = await db.cartItem.findMany({
    where:   { userId },
    include: { product: true },
    orderBy: { product: { title: "asc" } },
  });

  const items = cartItems.map((ci) => ({
    id:       ci.productId,
    title:    ci.product.title,
    artist:   ci.product.artist,
    price:    getEffectivePriceInCents(ci.product) / 100,
    quantity: ci.quantity,
  }));

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const result = await requireUser();
  if (result instanceof NextResponse) return result;
  const { userId } = result;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = AddToCartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { productId } = parsed.data;

  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  await db.cartItem.upsert({
    where:  { userId_productId: { userId, productId } },
    create: { userId, productId, quantity: 1 },
    update: { quantity: { increment: 1 } },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const result = await requireUser();
  if (result instanceof NextResponse) return result;
  const { userId } = result;

  await db.cartItem.deleteMany({ where: { userId } });

  return new NextResponse(null, { status: 204 });
}
