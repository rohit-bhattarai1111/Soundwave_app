import { config } from "dotenv";
import { createClient } from "@libsql/client";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Prefer store env (matches Next.js), then packages/db/.env
config({ path: resolve(__dirname, "../../../apps/store/.env.local"), override: true });
config({ path: resolve(__dirname, "../.env"), override: false });

async function columnExists(
  client: ReturnType<typeof createClient>,
  table: string,
  column: string
): Promise<boolean> {
  const result = await client.execute(`PRAGMA table_info("${table}")`);
  return result.rows.some((row) => {
    const r = row as Record<string, unknown>;
    const name = String(r.name ?? r["name"] ?? "");
    return name === column;
  });
}

async function tableExists(
  client: ReturnType<typeof createClient>,
  table: string
): Promise<boolean> {
  const result = await client.execute(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`
  );
  return result.rows.length > 0;
}

async function applyMigrationSql(
  client: ReturnType<typeof createClient>,
  sql: string,
  migrationName: string
): Promise<void> {
  // Skip the init migration when the database was already bootstrapped.
  if (migrationName.includes("init") && (await tableExists(client, "Product"))) {
    console.log("    ↷ Product table exists — skipping init migration");
    return;
  }

  const addColumnMatch = sql.match(
    /ALTER TABLE "(\w+)" ADD COLUMN "(\w+)" (\w+(?:\([^)]*\))?)/i
  );

  if (addColumnMatch) {
    const [, table, column] = addColumnMatch;
    if (await columnExists(client, table!, column!)) {
      console.log(`    ↷ Column ${table}.${column} already exists — skipping`);
      return;
    }
  }

  await client.executeMultiple(sql);
}

async function main() {
  const url = process.env.DATABASE_URL ?? "";

  if (!url.startsWith("libsql://")) {
    console.error(
      "❌  DATABASE_URL must be a libsql:// URL.\n" +
      "    Set it in packages/db/.env to your Turso URL."
    );
    process.exit(1);
  }

  const migrationsDir = resolve(__dirname, "../prisma/migrations");
  const migrationDirs = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const client = createClient({ url });

  console.log("🔌  Connecting to Turso...");
  console.log(`    ${url.split("?")[0]}\n`);

  for (const dir of migrationDirs) {
    const migrationPath = resolve(migrationsDir, dir, "migration.sql");
    let sql = readFileSync(migrationPath, "utf-8");

    sql = sql.replace(/CREATE TABLE "/g, 'CREATE TABLE IF NOT EXISTS "');

    console.log(`  Applying ${dir}...`);
    await applyMigrationSql(client, sql, dir);
  }

  console.log("\n✅  All migrations applied successfully.");
  console.log("    Optional: pnpm --filter @repo/db run db:seed\n");

  client.close();
}

main().catch((err) => {
  console.error("❌  Migration failed:", err);
  process.exit(1);
});
