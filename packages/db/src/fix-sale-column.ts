/**
 * One-off: verify Product.salePriceInCents exists on Turso and add it if missing.
 * Usage: pnpm --filter @repo/db run db:fix:sale-column
 */
import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Prefer store env (same as Next.js dev), fall back to packages/db/.env
config({ path: resolve(__dirname, "../../../apps/store/.env.local"), override: true });
config({ path: resolve(__dirname, "../.env"), override: false });

const url = process.env.DATABASE_URL ?? "";
if (!url.startsWith("libsql://")) {
  console.error("❌ DATABASE_URL must be libsql:// (check apps/store/.env.local or packages/db/.env)");
  process.exit(1);
}

const client = createClient({ url });

function rowName(row: Record<string, unknown>): string {
  return String(row.name ?? row["name"] ?? "");
}

async function main() {
  console.log("🔌 Checking Turso:", url.split("?")[0]);

  const info = await client.execute('PRAGMA table_info("Product")');
  const columns = info.rows.map((r) => rowName(r as Record<string, unknown>));
  console.log("   Columns:", columns.join(", "));

  if (columns.includes("salePriceInCents")) {
    console.log("✅ salePriceInCents already exists — nothing to do.");
    return;
  }

  console.log("➕ Adding salePriceInCents column...");
  await client.execute(
    'ALTER TABLE "Product" ADD COLUMN "salePriceInCents" INTEGER'
  );
  console.log("✅ Column added successfully.");
}

main()
  .catch((err) => {
    console.error("❌ Failed:", err);
    process.exit(1);
  })
  .finally(() => client.close());
