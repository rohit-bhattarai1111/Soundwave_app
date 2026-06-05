// GET    /api/cart — list the logged-in user's cart items, joined with product info
// POST   /api/cart — add/increment a product in the cart (upsert)
// DELETE /api/cart — clear ALL items in the cart (triggered by "Clear Cart" button)
//
// All three routes require a valid session (checked by requireUser()).
// The userId always comes from the session — never from a URL parameter.
// This prevents a user from reading or modifying another user's cart.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@repo/db/client";
import { requireUser } from "@/lib/auth-helper";

// ─── Validation ───────────────────────────────────────────────────────────────

const AddToCartSchema = z.object({
  productId: z.string().min(1, "productId is required."),
});

// ─── GET — list cart items ────────────────────────────────────────────────────

export async function GET() {
  const result = await requireUser();
  if (result instanceof NextResponse) return result;
  const { userId } = result;

  // db.cartItem.findMany with include: { product: true } is Prisma's way of
  // doing a SQL JOIN — it fetches the CartItem rows AND the related Product row
  // for each one, in a single query. See the conceptual explanation below.
  const cartItems = await db.cartItem.findMany({
    where:   { userId },
    include: { product: true },          // JOIN CartItem → Product
    orderBy: { product: { title: "asc" } },
  });

  // Map the DB shape to the CartItem shape the CartContext expects.
  //
  //   DB CartItem                →  CartContext CartItem
  //   ci.productId               →  id          (cart item key = product id)
  //   ci.product.title           →  title
  //   ci.product.artist          →  artist
  //   ci.product.priceInCents/100 →  price      (cents → dollars)
  //   ci.quantity                →  quantity
  const items = cartItems.map((ci) => ({
    id:       ci.productId,
    title:    ci.product.title,
    artist:   ci.product.artist,
    price:    ci.product.priceInCents / 100,
    quantity: ci.quantity,
  }));

  return NextResponse.json(items);
}

// ─── POST — add/increment a product ──────────────────────────────────────────

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

  // Check the product exists before trying to add it.
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  // Upsert: if a CartItem already exists for this (userId, productId) pair,
  // increment the quantity by 1. Otherwise, create a new row with quantity = 1.
  //
  // The compound unique index name in Prisma is formed by joining field names
  // with underscores: @@unique([userId, productId]) → userId_productId.
  await db.cartItem.upsert({
    where:  { userId_productId: { userId, productId } },
    create: { userId, productId, quantity: 1 },
    update: { quantity: { increment: 1 } },
  });

  return NextResponse.json({ ok: true });
}

// ─── DELETE — clear all items ─────────────────────────────────────────────────

export async function DELETE() {
  const result = await requireUser();
  if (result instanceof NextResponse) return result;
  const { userId } = result;

  // deleteMany with a where clause is safe — it only deletes rows owned by this user.
  // It also succeeds (with 0 deletions) if the cart is already empty, so it's
  // safe to call even after checkout (which also clears the cart).
  await db.cartItem.deleteMany({ where: { userId } });

  // 204 No Content — success, nothing to return.
  return new NextResponse(null, { status: 204 });
}
