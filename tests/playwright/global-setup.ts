import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_PACKAGE = path.resolve(__dirname, "../../packages/db");

const DEFAULT_DB_PATH = path.join(DB_PACKAGE, "prisma", "test.db");
const DEFAULT_TEST_DB_URL = `file:${DEFAULT_DB_PATH.replace(/\\/g, "/")}`;

const TEST_DATABASE_URL = process.env["DATABASE_URL"] ?? DEFAULT_TEST_DB_URL;

export default async function globalSetup(): Promise<void> {
  console.log("\n🔧 Resetting E2E test database...");
  console.log(`   DB: ${TEST_DATABASE_URL}\n`);

  const env = {
    ...process.env,
    DATABASE_URL: TEST_DATABASE_URL,
  };

  execSync(
    "pnpm exec prisma migrate reset --force --skip-generate --skip-seed",
    { cwd: DB_PACKAGE, env, stdio: "inherit" }
  );

  execSync(
    "pnpm exec tsx src/seed-e2e.ts",
    { cwd: DB_PACKAGE, env, stdio: "inherit" }
  );

  console.log("\n✅ E2E database ready.\n");
}
