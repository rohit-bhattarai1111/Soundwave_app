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

  // #region agent log
  const dbUrl = process.env.DATABASE_URL ?? "";
  let productColumns: string[] = [];
  let schemaCheckError: string | null = null;
  try {
    const rows = await db.$queryRaw<Array<{ name: string }>>`
      PRAGMA table_info("Product")
    `;
    productColumns = rows.map((r) => r.name);
  } catch (e) {
    schemaCheckError = e instanceof Error ? e.message : "schema check failed";
  }
  fetch("http://127.0.0.1:7424/ingest/39d97a18-fdaa-4f42-a174-441cdd332d97", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "7380e9" },
    body: JSON.stringify({
      sessionId: "7380e9",
      hypothesisId: "H2-H5",
      location: "apps/store/app/page.tsx:Home",
      message: "Before findMany schema check",
      data: {
        urlScheme: dbUrl.split(":")[0] ?? "missing",
        urlHost: dbUrl.startsWith("libsql://")
          ? dbUrl.split("?")[0].replace("libsql://", "")
          : dbUrl.replace(/^file:/, "file:…"),
        productColumns,
        hasSaleColumn: productColumns.includes("salePriceInCents"),
        schemaCheckError,
        onSale,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  let products;
  let findManyError: string | null = null;
  try {
    products = await db.product.findMany({
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
  } catch (e) {
    findManyError = e instanceof Error ? e.message : "findMany failed";
    throw e;
  } finally {
    // #region agent log
    fetch("http://127.0.0.1:7424/ingest/39d97a18-fdaa-4f42-a174-441cdd332d97", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "7380e9" },
      body: JSON.stringify({
        sessionId: "7380e9",
        hypothesisId: "H6",
        location: "apps/store/app/page.tsx:Home",
        message: findManyError ? "findMany failed" : "findMany succeeded",
        data: {
          findManyError,
          productCount: products?.length ?? 0,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <ProductGrid products={products as Product[]} />
    </main>
  );
}
