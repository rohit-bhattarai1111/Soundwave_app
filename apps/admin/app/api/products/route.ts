// GET  /api/products — list all products (newest first)
// POST /api/products — create a new product
//
// Both routes require an ADMIN session (checked by requireAdmin()).
// The client sends data in UI format (price in dollars, display genre labels).
// We convert to DB format (priceInCents in cents, uppercase genre strings) before writing.

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@repo/db/client";
import { requireAdmin } from "@/lib/api-auth";
import { DB_TO_UI_GENRE, UI_TO_DB_GENRE } from "@/lib/genre";
import type { Genre } from "@/lib/mock-data";

// ─── Validation schema ────────────────────────────────────────────────────────
// Zod validates the incoming request body on the server before touching the DB.
// Why validate on the server even though the modal already validates on the client?
//   Because any client-side check can be bypassed — someone can fire a raw curl/fetch
//   request straight at this endpoint. Server validation is the real security gate.

const ProductCreateSchema = z.object({
  title:      z.string().min(1, "Title is required."),
  artist:     z.string().min(1, "Artist is required."),
  // The four genre labels exactly as they appear in the UI.
  genre:      z.enum(["Rock", "Jazz", "Hip-Hop", "Electronic"] as const),
  // Receives price in dollars (e.g. 9.99); we multiply by 100 before storing.
  price:      z.number().positive("Price must be greater than 0."),
  stock:      z.number().int().min(0, "Stock cannot be negative."),
  imageUrl:   z.string().url().or(z.literal("")),
  previewUrl: z.string().default("/preview-placeholder.mp3"),
});

// ─── GET — list all products ──────────────────────────────────────────────────

export async function GET() {
  // Admin-only: even reads are gated so the full product list can't be accessed
  // by anyone who hasn't authenticated as ADMIN.
  const authError = await requireAdmin();
  if (authError) return authError;

  // Fetch every product row, newest first.
  const dbProducts = await db.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Convert each DB row from the internal storage format to the shape the UI expects.
  const products = dbProducts.map((p) => ({
    id:         p.id,
    title:      p.title,
    artist:     p.artist,
    genre:      (DB_TO_UI_GENRE[p.genre] ?? "Rock") as Genre,  // "ROCK" → "Rock"
    price:      p.priceInCents / 100,   // 999 cents → $9.99
    stock:      p.stockQty,
    imageUrl:   p.imageUrl,
    previewUrl: p.previewUrl,
  }));

  return NextResponse.json(products);
}

// ─── POST — create a product ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  // Parse the JSON body. If the body isn't valid JSON at all, return 400.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  // Validate the parsed body against the schema.
  // safeParse never throws — it returns { success: true, data } or { success: false, error }.
  const result = ProductCreateSchema.safeParse(body);
  if (!result.success) {
    // flatten().fieldErrors gives per-field error arrays: { title: ["Title is required."] }
    return NextResponse.json(
      { error: "Validation failed.", details: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { title, artist, genre, price, stock, imageUrl, previewUrl } = result.data;

  try {
    // db.product.create() inserts the row and returns the full created record,
    // including the DB-assigned cuid() id that the client needs.
    const created = await db.product.create({
      data: {
        title,
        artist,
        genre:        UI_TO_DB_GENRE[genre],       // "Rock" → "ROCK"
        priceInCents: Math.round(price * 100),      // $9.99 → 999 (integer, no float drift)
        stockQty:     stock,
        // Auto-generate a picsum URL if the admin left imageUrl blank.
        imageUrl:     imageUrl || `https://picsum.photos/seed/${encodeURIComponent(title)}/400/400`,
        previewUrl,
      },
    });

    // Return the created product in UI format so the client can update its local state.
    // 201 Created — a new resource was created (as opposed to 200 which means "here is data").
    return NextResponse.json(
      {
        id:         created.id,
        title:      created.title,
        artist:     created.artist,
        genre:      (DB_TO_UI_GENRE[created.genre] ?? "Rock") as Genre,
        price:      created.priceInCents / 100,
        stock:      created.stockQty,
        imageUrl:   created.imageUrl,
        previewUrl: created.previewUrl,
      },
      { status: 201 }
    );

  } catch (err: unknown) {
    // Prisma error P2002 = "Unique constraint failed".
    // Our Product model has @@unique([title, artist]), so the same album by the
    // same artist can't be added twice.
    if (isPrismaError(err, "P2002")) {
      return NextResponse.json(
        { error: "A product with that title and artist already exists." },
        { status: 409 }   // 409 Conflict
      );
    }
    console.error("[POST /api/products]", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Type-safe check for Prisma client errors by error code.
// Prisma errors have a "code" property like "P2002" (unique constraint) or "P2025" (not found).
function isPrismaError(err: unknown, code: string): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === code
  );
}
