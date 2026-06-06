import { NextResponse, type NextRequest } from "next/server";
import { db } from "@repo/db/client";
import { requireAdmin } from "@/lib/api-auth";
import { DB_TO_UI_GENRE, UI_TO_DB_GENRE } from "@/lib/genre";
import { ProductBodySchema, salePriceToCents, centsToSalePrice } from "@/lib/product-schema";
import type { Genre } from "@/lib/mock-data";

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

  const result = ProductBodySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: result.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { title, artist, genre, price, salePrice, stock, imageUrl, previewUrl } = result.data;

  try {
    const updated = await db.product.update({
      where: { id: params.id },
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

    return NextResponse.json({
      id:         updated.id,
      title:      updated.title,
      artist:     updated.artist,
      genre:      (DB_TO_UI_GENRE[updated.genre] ?? "Rock") as Genre,
      price:      updated.priceInCents / 100,
      salePrice:  centsToSalePrice(updated.salePriceInCents),
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
    const product = await db.product.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        _count: { select: { cartItems: true, orderItems: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    // #region agent log
    fetch("http://127.0.0.1:7424/ingest/39d97a18-fdaa-4f42-a174-441cdd332d97", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "7380e9" },
      body: JSON.stringify({
        sessionId: "7380e9",
        runId: "post-fix",
        hypothesisId: "A-B",
        location: "apps/admin/app/api/products/[id]/route.ts:DELETE",
        message: "delete dependency counts",
        data: {
          productId: params.id,
          cartItems: product._count.cartItems,
          orderItems: product._count.orderItems,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    await db.$transaction([
      db.cartItem.deleteMany({ where: { productId: params.id } }),
      db.orderItem.deleteMany({ where: { productId: params.id } }),
      db.product.delete({ where: { id: params.id } }),
    ]);

    // #region agent log
    fetch("http://127.0.0.1:7424/ingest/39d97a18-fdaa-4f42-a174-441cdd332d97", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "7380e9" },
      body: JSON.stringify({
        sessionId: "7380e9",
        runId: "post-fix",
        hypothesisId: "A-B",
        location: "apps/admin/app/api/products/[id]/route.ts:DELETE",
        message: "product deleted",
        data: {
          productId: params.id,
          removedCartItems: product._count.cartItems,
          removedOrderItems: product._count.orderItems,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

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

