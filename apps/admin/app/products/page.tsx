import { db } from "@repo/db/client";
import { DB_TO_UI_GENRE } from "@/lib/genre";
import { centsToSalePrice } from "@/lib/product-schema";
import type { Genre, Product } from "@/lib/mock-data";
import { ProductsProvider } from "@/contexts/ProductsContext";
import { ProductsPageContent } from "./ProductsPageContent";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const dbProducts = await db.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  const products: Product[] = dbProducts.map((p) => {
    const salePriceInCents =
      "salePriceInCents" in p
        ? (p as { salePriceInCents: number | null }).salePriceInCents
        : null;

    return {
      id:         p.id,
      title:      p.title,
      artist:     p.artist,
      genre:      (DB_TO_UI_GENRE[p.genre] ?? "Rock") as Genre,
      price:      p.priceInCents / 100,
      salePrice:  centsToSalePrice(salePriceInCents),
      stock:      p.stockQty,
      imageUrl:   p.imageUrl,
      previewUrl: p.previewUrl,
    };
  });

  return (
    <ProductsProvider initialProducts={products}>
      <ProductsPageContent />
    </ProductsProvider>
  );
}
