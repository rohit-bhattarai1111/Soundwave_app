import { Suspense }    from "react";
import type { Product } from "@/lib/types";
import { SearchBar }   from "@/components/SearchBar";
import { GenreFilter } from "@/components/GenreFilter";
import { ProductCard } from "@/components/ProductCard";

interface ProductGridProps {
  products: Product[];
}

function FiltersSkeleton() {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="h-10 w-full max-w-md animate-pulse rounded-full bg-gray-200" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-gray-200" />
        ))}
      </div>
    </div>
  );
}

export function ProductGrid({ products }: ProductGridProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

      <Suspense fallback={<FiltersSkeleton />}>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchBar />
          <GenreFilter />
        </div>
      </Suspense>

      {products.length === 0 ? (
        <p className="py-20 text-center text-gray-500">
          No albums match your search.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
