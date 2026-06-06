import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/db/client";
import { errorResponse } from "@/lib/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const { id } = params;

  try {
    const product = await db.product.findUnique({
      where: { id },
      select: {
        id:           true,
        title:        true,
        artist:       true,
        genre:        true,
        priceInCents: true,
        imageUrl:     true,
        previewUrl:   true,
        stockQty:     true,
      },
    });

    if (!product) {
      return errorResponse("Product not found.", undefined, 404);
    }

    return NextResponse.json(product);

  } catch (err) {
    console.error(`[GET /api/products/${id}] Unexpected error:`, err);
    return errorResponse("Failed to fetch product.", undefined, 500);
  }
}
