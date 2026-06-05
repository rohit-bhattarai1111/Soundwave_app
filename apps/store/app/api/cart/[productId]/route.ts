// PUT    /api/cart/[productId] — update the quantity of a specific cart item
// DELETE /api/cart/[productId] — remove a specific cart item
//
// [productId] is the id of the Product (= CartItem.productId in the DB).
// The CartItem table has no separate id column — its key is (userId, productId).
//
// Security note: we always filter by BOTH userId (from session) AND productId (from URL).
// This means a user can only modify their own cart items — they cannot manipulate
// another user's cart even if they know that user's productId.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@repo/db/client";
import { requireUser } from "@/lib/auth-helper";

// ─── Validation ───────────────────────────────────────────────────────────────

const UpdateQtySchema = z.object({
  // Quantity of 0 means "remove the item" — handled by DELETE logic below.
  quantity: z.number().int().min(0, "Quantity must be 0 or more."),
});

// ─── PUT — update quantity ────────────────────────────────────────────────────

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

  // If the client sends quantity === 0, treat it as a remove.
  // The CartContext's reducer also filters out items with quantity === 0,
  // so this matches the client-side behaviour.
  if (quantity === 0) {
    await db.cartItem.deleteMany({
      where: { userId, productId: params.productId },
    });
    return new NextResponse(null, { status: 204 });
  }

  // Verify ownership: find the row that belongs to THIS user.
  // We use findUnique here so we get a clear 404 if the row doesn't exist
  // (rather than silently failing an update on no rows).
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

// ─── DELETE — remove one item ─────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { productId: string } }
) {
  const result = await requireUser();
  if (result instanceof NextResponse) return result;
  const { userId } = result;

  // deleteMany with userId + productId in the where clause ensures the row
  // must belong to this user. Using deleteMany (not delete) because delete
  // requires a unique where clause — we could use the compound unique, but
  // deleteMany is more readable here and succeeds even if the row doesn't exist.
  await db.cartItem.deleteMany({
    where: { userId, productId: params.productId },
  });

  return new NextResponse(null, { status: 204 });
}
