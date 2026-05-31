// ProductGrid — lays out the search/filter controls and the album card grid.
//
// ITERATION 1: This was a "use client" component with two useState hooks
//   (searchQuery, activeGenre) and client-side .filter() on the albums array.
//
// ITERATION 2: No "use client" — this is now a SERVER COMPONENT.
//   - Filtering is done by the database in page.tsx before this component runs.
//   - It receives already-filtered products as a prop and just renders them.
//   - SearchBar and GenreFilter are still client components (they need browser
//     hooks to write to the URL), but a Server Component can render Client
//     Components as children — that's perfectly valid in Next.js App Router.
//   - The <Suspense> wrapper is required because SearchBar and GenreFilter use
//     useSearchParams(), which needs a Suspense boundary in Next.js 14.

import { Suspense }    from "react";
import type { Product } from "@/lib/types";
import { SearchBar }   from "@/components/SearchBar";
import { GenreFilter } from "@/components/GenreFilter";
import { ProductCard } from "@/components/ProductCard";

interface ProductGridProps {
  // Already filtered by the DB — this component just renders what it receives.
  products: Product[];
}

// A tiny skeleton row shown while SearchBar and GenreFilter hydrate.
// Without this, the Suspense fallback would be a blank controls area.
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

      {/* ── Filter controls ─────────────────────────────────────────────────── */}
      {/* Suspense is required here because SearchBar and GenreFilter call
          useSearchParams(), which is asynchronous during server-side streaming.
          Next.js 14 requires these components to be inside a Suspense boundary.
          The fallback shows a skeleton while the client JS loads. */}
      <Suspense fallback={<FiltersSkeleton />}>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* SearchBar reads ?search= from the URL and writes back to it */}
          <SearchBar />
          {/* GenreFilter reads ?genre= from the URL and writes back to it */}
          <GenreFilter />
        </div>
      </Suspense>

      {/* ── Album grid ──────────────────────────────────────────────────────── */}
      {/* "No results" state — shown when the DB query returned zero rows */}
      {products.length === 0 ? (
        <p className="py-20 text-center text-gray-500">
          No albums match your search.
        </p>
      ) : (
        // Responsive column count — same breakpoints as iteration 1.
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            // key={product.id} tells React which card corresponds to which DB row
            // so it can efficiently update only the cards that changed.
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
