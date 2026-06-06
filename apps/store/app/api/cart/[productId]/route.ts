import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@repo/db/client";
import { requireUser } from "@/lib/auth-helper";

const UpdateQtySchema = z.object({
  quantity: z.number().int().min(0, "Quantity must be 0 or more."),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  const result = await requireUser();
  if (result instanceof NextResponse) return result;
  const { userId } = result;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = UpdateQtySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { quantity } = parsed.data;

  if (quantity === 0) {
    await db.cartItem.deleteMany({
      where: { userId, productId: params.productId },
    });
    return new NextResponse(null, { status: 204 });
  }

  const existing = await db.cartItem.findUnique({
    where: { userId_productId: { userId, productId: params.productId } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Cart item not found." }, { status: 404 });
  }

  await db.cartItem.update({
    where: { userId_productId: { userId, productId: params.productId } },
    data:  { quantity },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { productId: string } }
) {
  const result = await requireUser();
  if (result instanceof NextResponse) return result;
  const { userId } = result;

  await db.cartItem.deleteMany({
    where: { userId, productId: params.productId },
  });

  return new NextResponse(null, { status: 204 });
}
