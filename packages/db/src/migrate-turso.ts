import "dotenv/config";

import { createClient } from "@libsql/client";
import { readFileSync }  from "node:fs";
import { resolve }       from "node:path";

async function main() {
  const url = process.env.DATABASE_URL ?? "";

  if (!url.startsWith("libsql://")) {
    console.error(
      "❌  DATABASE_URL must be a libsql:// URL.\n" +
      "    Make sure packages/db/.env has DATABASE_URL set to your Turso URL."
    );
    process.exit(1);
  }

  const migrationPath = resolve(
    __dirname,
    "../prisma/migrations/20240101000000_init/migration.sql"
  );

  const sql = readFileSync(migrationPath, "utf-8").replace(
    /CREATE TABLE "/g,
    'CREATE TABLE IF NOT EXISTS "'
  );

  const client = createClient({ url });

  console.log("🔌  Connecting to Turso...");
  console.log(`    ${url.split("?")[0]}\n`);

  await client.executeMultiple(sql);

  console.log("✅  Migration applied successfully.");
  console.log("    Next step: seed the database —");
  console.log("    pnpm exec prisma db seed\n");

  client.close();
}

main().catch((err) => {
  console.error("❌  Migration failed:", err);
  process.exit(1);
});
