// route.ts — GET /api/products/:id
//
// Returns a single product by its ID, or 404 if not found.
//
// The [id] folder name is Next.js dynamic routing — the segment in square
// brackets becomes a variable. So a request to /api/products/clxyz123 gives
// params.id = "clxyz123". The same syntax works for pages (/app/products/[id]/page.tsx).
//
// Example requests:
//   GET /api/products/clxyz123   → { id, title, artist, ... }  (200)
//   GET /api/products/notreal    → { error: "Product not found." } (404)

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/db/client";
import { errorResponse } from "@/lib/api";

// The second argument to a Route Handler is the route context.
// `params` contains the dynamic segments from the URL.
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const { id } = params;

  try {
    // findUnique returns null (not an exception) when no row matches.
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
        // Include stockQty here since a detail page might want to show it.
        stockQty:     true,
      },
    });

    if (!product) {
      // 404 Not Found — the resource doesn't exist.
      return errorResponse("Product not found.", undefined, 404);
    }

    return NextResponse.json(product);

  } catch (err) {
    console.error(`[GET /api/products/${id}] Unexpected error:`, err);
    return errorResponse("Failed to fetch product.", undefined, 500);
  }
}
