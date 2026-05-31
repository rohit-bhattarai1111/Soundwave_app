// PUT    /api/products/[id]  — update a product (full field replacement)
// DELETE /api/products/[id]  — remove a product
//
// [id] is the cuid() string assigned by the database when the product was created.
// Both routes require an ADMIN session (checked by requireAdmin()).

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@repo/db/client";
import { requireAdmin } from "@/lib/api-auth";
import { DB_TO_UI_GENRE, UI_TO_DB_GENRE } from "@/lib/genre";
import type { Genre } from "@/lib/mock-data";

// ─── Validation schema ────────────────────────────────────────────────────────
// Identical to the POST schema — PUT is a full replacement (all fields required).
// PATCH (partial update) would use .partial() to make fields optional, but we're
// doing a full replacement here because the modal always sends all fields.

const ProductUpdateSchema = z.object({
  title:      z.string().min(1, "Title is required."),
  artist:     z.string().min(1, "Artist is required."),
  genre:      z.enum(["Rock", "Jazz", "Hip-Hop", "Electronic"] as const),
  price:      z.number().positive("Price must be greater than 0."),
  stock:      z.number().int().min(0, "Stock cannot be negative."),
  imageUrl:   z.string().url().or(z.literal("")),
  previewUrl: z.string().default("/preview-placeholder.mp3"),
});

// ─── PUT — update a product ───────────────────────────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const result = ProductUpdateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { title, artist, genre, price, stock, imageUrl, previewUrl } = result.data;

  try {
    // db.product.update() throws a P2025 error if the id doesn't exist.
    const updated = await db.product.update({
      where: { id: params.id },
      data: {
        title,
        artist,
        genre:        UI_TO_DB_GENRE[genre],
        priceInCents: Math.round(price * 100),
        stockQty:     stock,
        imageUrl:     imageUrl || `https://picsum.photos/seed/${encodeURIComponent(title)}/400/400`,
        previewUrl,
      },
    });

    // Return the updated product in UI format so the client can dispatch UPDATE_PRODUCT.
    return NextResponse.json({
      id:         updated.id,
      title:      updated.title,
      artist:     updated.artist,
      genre:      (DB_TO_UI_GENRE[updated.genre] ?? "Rock") as Genre,
      price:      updated.priceInCents / 100,
      stock:      updated.stockQty,
      imageUrl:   updated.imageUrl,
      previewUrl: updated.previewUrl,
    });

  } catch (err: unknown) {
    // P2025 = "Record to update not found" — the id in the URL doesn't exist.
    if (isPrismaError(err, "P2025")) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    // P2002 = unique constraint — editing title+artist to match an existing pair.
    if (isPrismaError(err, "P2002")) {
      return NextResponse.json(
        { error: "A product with that title and artist already exists." },
        { status: 409 }
      );
    }
    console.error("[PUT /api/products/[id]]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

// ─── DELETE — remove a product ────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    await db.product.delete({ where: { id: params.id } });

    // 204 No Content — the operation succeeded and there's nothing to return.
    // This is the correct status code for a successful DELETE with no response body.
    // Using `new NextResponse(null, ...)` because NextResponse.json() requires a body.
    return new NextResponse(null, { status: 204 });

  } catch (err: unknown) {
    if (isPrismaError(err, "P2025")) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    console.error("[DELETE /api/products/[id]]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isPrismaError(err: unknown, code: string): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === code
  );
}
