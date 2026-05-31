// route.ts — GET /api/products
//
// Returns a JSON array of products, optionally filtered by ?search= and ?genre=.
// The filtering logic mirrors what page.tsx does for server-side rendering —
// the API is useful for any future client that wants raw JSON (mobile apps,
// admin scripts, etc.) rather than a full HTML page.
//
// Example requests:
//   GET /api/products                        → all 12 products
//   GET /api/products?search=neon            → products whose title/artist contains "neon"
//   GET /api/products?genre=ROCK             → only Rock albums
//   GET /api/products?search=blue&genre=JAZZ → combined filter

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/db/client";
import { errorResponse } from "@/lib/api";

export async function GET(req: NextRequest): Promise<NextResponse> {
  // URL is always present on a NextRequest — the URL constructor never throws here.
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const genre  = searchParams.get("genre")  ?? "";

  try {
    const products = await db.product.findMany({
      where: {
        // Conditionally add the search filter — same pattern as page.tsx.
        ...(search
          ? {
              OR: [
                { title:  { contains: search } },
                { artist: { contains: search } },
              ],
            }
          : {}),

        // "all" is the UI sentinel meaning "no filter" — treat it the same as empty.
        ...(genre && genre !== "all" ? { genre } : {}),
      },
      orderBy: { createdAt: "desc" },
      // Lean select — don't send stockQty or internal fields to the client.
      select: {
        id:           true,
        title:        true,
        artist:       true,
        genre:        true,
        priceInCents: true,
        imageUrl:     true,
        previewUrl:   true,
      },
    });

    return NextResponse.json(products);

  } catch (err) {
    console.error("[GET /api/products] Unexpected error:", err);
    return errorResponse("Failed to fetch products.", undefined, 500);
  }
}
