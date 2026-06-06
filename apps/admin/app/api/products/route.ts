import { NextResponse, type NextRequest } from "next/server";
import { db } from "@repo/db/client";
import { requireAdmin } from "@/lib/api-auth";
import { DB_TO_UI_GENRE, UI_TO_DB_GENRE } from "@/lib/genre";
import { ProductBodySchema, salePriceToCents, centsToSalePrice } from "@/lib/product-schema";
import type { Genre } from "@/lib/mock-data";

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  const dbProducts = await db.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  const products = dbProducts.map((p) => ({
    id:         p.id,
    title:      p.title,
    artist:     p.artist,
    genre:      (DB_TO_UI_GENRE[p.genre] ?? "Rock") as Genre,
    price:      p.priceInCents / 100,
    salePrice:  centsToSalePrice(p.salePriceInCents),
    stock:      p.stockQty,
    imageUrl:   p.imageUrl,
    previewUrl: p.previewUrl,
  }));

  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const result = ProductBodySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { title, artist, genre, price, salePrice, stock, imageUrl, previewUrl } = result.data;

  try {
    const created = await db.product.create({
      data: {
        title,
        artist,
        genre:            UI_TO_DB_GENRE[genre],
        priceInCents:     Math.round(price * 100),
        salePriceInCents: salePriceToCents(salePrice),
        stockQty:         stock,
        imageUrl:         imageUrl || `https://picsum.photos/seed/${encodeURIComponent(title)}/400/400`,
        previewUrl,
      },
    });

    return NextResponse.json(
      {
        id:         created.id,
        title:      created.title,
        artist:     created.artist,
        genre:      (DB_TO_UI_GENRE[created.genre] ?? "Rock") as Genre,
        price:      created.priceInCents / 100,
        salePrice:  centsToSalePrice(created.salePriceInCents),
        stock:      created.stockQty,
        imageUrl:   created.imageUrl,
        previewUrl: created.previewUrl,
      },
      { status: 201 }
    );

  } catch (err: unknown) {
    if (isPrismaError(err, "P2002")) {
      return NextResponse.json(
        { error: "A product with that title and artist already exists." },
        { status: 409 }
      );
    }
    console.error("[POST /api/products]", err);
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
