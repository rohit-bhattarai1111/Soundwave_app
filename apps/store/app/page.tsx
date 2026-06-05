// page.tsx — the store home page.
//
// This is an ASYNC Server Component — it fetches data from the database
// before sending any HTML to the browser. The key differences from iteration 1:
//
// ITERATION 1: import albums from a local TypeScript array → STATIC rendering
//   - The page was built once at deploy time (or on first request)
//   - Filtering happened in the browser with useState — no server involvement
//
// ITERATION 2: await db.product.findMany() → DYNAMIC rendering
//   - The page re-runs on EVERY request because it reads searchParams
//   - Filtering happens in the database via a WHERE clause — zero JS sent for filtering
//   - Next.js detects that this page reads searchParams and automatically
//     opts it into dynamic rendering (it can no longer be cached statically)
//
// The UI looks identical to iteration 1 — only the data source changed.

import { db }          from "@repo/db/client";
import { Navbar }      from "@/components/Navbar";
import { ProductGrid } from "@/components/ProductGrid";
import type { Product } from "@/lib/types";

// Next.js passes URL query params as the `searchParams` prop.
// e.g. visiting /?search=neon&genre=ROCK gives: { search: "neon", genre: "ROCK" }
interface HomeProps {
  searchParams: { search?: string; genre?: string };
}

export default async function Home({ searchParams }: HomeProps) {
  // Read current filter values from the URL.
  // Fallback to empty string so the Prisma where clause stays clean.
  const search = searchParams.search ?? "";
  const genre  = searchParams.genre  ?? "";

  // ── Database query with server-side filtering ────────────────────────────
  // db.product.findMany() maps directly to a SQL SELECT … FROM "Product" …
  // Prisma builds the WHERE clause from the `where` object below.
  //
  // This is equivalent to:
  //   SELECT * FROM Product
  //   WHERE (title LIKE '%neon%' OR artist LIKE '%neon%')
  //     AND genre = 'ROCK'
  //   ORDER BY createdAt DESC;
  const products = await db.product.findMany({
    where: {
      // Spread operator conditionally adds clauses.
      // If `search` is empty, the OR block is omitted entirely.
      ...(search
        ? {
            OR: [
              // SQLite's LIKE is case-insensitive for ASCII, so "neon" matches "Neon".
              // (The `mode: 'insensitive'` option only works with PostgreSQL —
              // we omit it here and rely on SQLite's default LIKE behaviour.)
              { title:  { contains: search } },
              { artist: { contains: search } },
            ],
          }
        : {}),

      // If genre is "all" or empty, don't filter — show every genre.
      // Otherwise match the exact DB value: "ROCK", "JAZZ", "HIP_HOP", "ELECTRONIC"
      ...(genre && genre !== "all" ? { genre } : {}),
    },
    // Most recently added albums appear first.
    orderBy: { createdAt: "desc" },
    // select only the fields ProductCard needs — keeps the query lean
    // and avoids sending stockQty, createdAt etc. over the wire.
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

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Navbar is a Server Component — renders on the server, zero client JS */}
      <Navbar />

      {/* ProductGrid receives already-filtered products from the server.
          It no longer needs useState for filtering — the URL and the DB handle that. */}
      <ProductGrid products={products as Product[]} />
    </main>
  );
}
