/**
 * Revert OrderItem to the original schema (no productTitle/productArtist).
 * Safe to run on Turso — no-ops when columns are already absent.
 *
 * Usage: pnpm --filter @repo/db run db:fix:order-item
 */
import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

config({ path: resolve(__dirname, "../../../apps/store/.env.local"), override: true });
config({ path: resolve(__dirname, "../.env"), override: false });

const url = process.env.DATABASE_URL ?? "";

function rowName(row: Record<string, unknown>): string {
  return String(row.name ?? row["name"] ?? "");
}

async function columnExists(
  client: ReturnType<typeof createClient>,
  table: string,
  column: string
): Promise<boolean> {
  const result = await client.execute(`PRAGMA table_info("${table}")`);
  return result.rows.some((row) => rowName(row as Record<string, unknown>) === column);
}

const REVERT_SQL = `
PRAGMA foreign_keys=OFF;

CREATE TABLE "OrderItem_new" (
    "id"             TEXT    NOT NULL PRIMARY KEY,
    "orderId"        TEXT    NOT NULL,
    "productId"      TEXT    NOT NULL,
    "quantity"       INTEGER NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "OrderItem_new" ("id", "orderId", "productId", "quantity", "unitPriceCents")
SELECT "id", "orderId", "productId", "quantity", "unitPriceCents"
FROM "OrderItem"
WHERE "productId" IS NOT NULL;

DROP TABLE "OrderItem";
ALTER TABLE "OrderItem_new" RENAME TO "OrderItem";

PRAGMA foreign_keys=ON;
`;

async function main() {
  if (url.startsWith("libsql://")) {
    const client = createClient({ url });
    console.log("🔌 Checking Turso:", url.split("?")[0]);

    if (!(await columnExists(client, "OrderItem", "productTitle"))) {
      console.log("✅ OrderItem already uses the original schema — nothing to do.");
      client.close();
      return;
    }

    console.log("↩️  Reverting OrderItem snapshot columns...");
    await client.executeMultiple(REVERT_SQL);
    console.log("✅ OrderItem schema reverted.");
    client.close();
    return;
  }

  if (url.startsWith("file:")) {
    const { PrismaClient } = await import("@prisma/client");
    const db = new PrismaClient({ datasourceUrl: url });

    const columns = await db.$queryRaw<Array<{ name: string }>>`
      PRAGMA table_info("OrderItem")
    `;

    if (!columns.some((c) => c.name === "productTitle")) {
      console.log("✅ OrderItem already uses the original schema — nothing to do.");
      await db.$disconnect();
      return;
    }

    console.log("↩️  Reverting OrderItem snapshot columns...");
    await db.$executeRawUnsafe(REVERT_SQL);
    console.log("✅ OrderItem schema reverted.");
    await db.$disconnect();
    return;
  }

  console.error("❌ Unsupported DATABASE_URL:", url);
  process.exit(1);
}

main().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
