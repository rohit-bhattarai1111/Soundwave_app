import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@repo/db/client";
import { requireAdmin } from "@/lib/api-auth";
import { DB_TO_UI_GENRE, UI_TO_DB_GENRE } from "@/lib/genre";
import type { Genre } from "@/lib/mock-data";

const ProductUpdateSchema = z.object({
  title:      z.string().min(1, "Title is required."),
  artist:     z.string().min(1, "Artist is required."),
  genre:      z.enum(["Rock", "Jazz", "Hip-Hop", "Electronic"] as const),
  price:      z.number().positive("Price must be greater than 0."),
  stock:      z.number().int().min(0, "Stock cannot be negative."),
  imageUrl:   z.string().url().or(z.literal("")),
  previewUrl: z.string().default("/preview-placeholder.mp3"),
});

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
    if (isPrismaError(err, "P2025")) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    await db.product.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });

  } catch (err: unknown) {
    if (isPrismaError(err, "P2025")) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }
    console.error("[DELETE /api/products/[id]]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

function isPrismaError(err: unknown, code: string): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === code
  );
}
