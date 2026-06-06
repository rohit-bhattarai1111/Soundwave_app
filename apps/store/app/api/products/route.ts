import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/db/client";
import { errorResponse } from "@/lib/api";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const genre  = searchParams.get("genre")  ?? "";
  const onSale = searchParams.get("sale") === "1";

  try {
    const products = await db.product.findMany({
      where: {
        ...(search
          ? {
              OR: [
                { title:  { contains: search } },
                { artist: { contains: search } },
              ],
            }
          : {}),
        ...(genre && genre !== "all" ? { genre } : {}),
        ...(onSale ? { salePriceInCents: { not: null } } : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id:               true,
        title:            true,
        artist:           true,
        genre:            true,
        priceInCents:     true,
        salePriceInCents: true,
        imageUrl:         true,
        previewUrl:       true,
      },
    });

    return NextResponse.json(products);

  } catch (err) {
    console.error("[GET /api/products] Unexpected error:", err);
    return errorResponse("Failed to fetch products.", undefined, 500);
  }
}
