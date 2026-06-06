import { db }          from "@repo/db/client";
import { Navbar }      from "@/components/Navbar";
import { ProductGrid } from "@/components/ProductGrid";
import type { Product } from "@/lib/types";

interface HomeProps {
  searchParams: { search?: string; genre?: string; sale?: string };
}

export default async function Home({ searchParams }: HomeProps) {
  const search = searchParams.search ?? "";
  const genre  = searchParams.genre  ?? "";
  const onSale = searchParams.sale === "1";

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

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <ProductGrid products={products as Product[]} />
    </main>
  );
}
