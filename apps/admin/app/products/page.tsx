// products/page.tsx — async Server Component.
//
// Why async Server Component instead of "use client"?
//   Server Components can run async code (like Prisma queries) directly, with
//   no useEffect, no loading spinner, and no HTTP round-trip. The HTML the
//   browser receives already contains the data — instant first paint.
//
//   "use client" components can't be async because they render in the browser
//   where there is no Prisma, no direct DB access, and no server-side imports.
//
// Data flow:
//   DB (Prisma query) → this file (Server, async)
//     → ProductsProvider (initialises useReducer with DB data)
//       → ProductsPageContent (Client Component, handles interactions)
//
// After any add/edit/delete, ProductsPageContent calls router.refresh().
// That tells Next.js to re-run this Server Component and get fresh data from the DB,
// so the next mount reflects the true database state (not just in-memory reducer state).

import { db } from "@repo/db/client";
import { DB_TO_UI_GENRE } from "@/lib/genre";
import type { Genre, Product } from "@/lib/mock-data";
import { ProductsProvider } from "@/contexts/ProductsContext";
import { ProductsPageContent } from "./ProductsPageContent";

// Always render at request time — product data is read from Prisma, not baked in at build.
export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  // Query Prisma directly — runs on the server, no fetch() needed.
  // orderBy createdAt desc → newest products appear at the top of the table.
  const dbProducts = await db.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Convert from the DB storage format to the shape the UI components expect.
  //
  //   DB field       → UI field
  //   priceInCents   → price   (999 cents → $9.99)
  //   stockQty       → stock
  //   genre "ROCK"   → genre "Rock"  (via DB_TO_UI_GENRE map)
  const products: Product[] = dbProducts.map((p) => ({
    id:         p.id,
    title:      p.title,
    artist:     p.artist,
    // DB_TO_UI_GENRE maps "ROCK" → "Rock" etc. Fall back to "Rock" for safety
    // if an unrecognised value somehow ends up in the DB.
    genre:      (DB_TO_UI_GENRE[p.genre] ?? "Rock") as Genre,
    price:      p.priceInCents / 100,   // cents → dollars for display
    stock:      p.stockQty,
    imageUrl:   p.imageUrl,
    previewUrl: p.previewUrl,
  }));

  return (
    // ProductsProvider is a Client Component — but it can be rendered here (in a
    // Server Component) because we're only passing it serialisable props (the products
    // array is plain JSON: strings and numbers). Server → Client props must be serialisable.
    <ProductsProvider initialProducts={products}>
      {/* ProductsPageContent is "use client" — it holds all useState/useRouter/useProducts logic */}
      <ProductsPageContent />
    </ProductsProvider>
  );
}
