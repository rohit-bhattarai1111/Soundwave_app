// Starts store or admin on test ports with an absolute SQLite test.db URL.
// Relative file: paths break on Windows (spaces in OneDrive paths) and when
// reuseExistingServer reuses a stale dev:test process.

import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [app, port, cookieName] = process.argv.slice(2);

if (!app || !port || !cookieName) {
  console.error(
    "Usage: node scripts/dev-test-server.mjs <store|admin> <port> <auth-cookie-name>"
  );
  process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(root, "apps", app);
const dbPackage = path.join(root, "packages", "db");
const testDb = path.join(dbPackage, "prisma", "test.db");
const databaseUrl = `file:${testDb.replace(/\\/g, "/")}`;

// Ensure test.db exists before Next.js serves pages that query Prisma.
if (!fs.existsSync(testDb)) {
  fs.mkdirSync(path.dirname(testDb), { recursive: true });
  spawnSync("pnpm", ["exec", "prisma", "migrate", "deploy"], {
    cwd: dbPackage,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: "inherit",
    shell: true,
  });
}

spawn("pnpm", ["exec", "next", "dev", "--port", port], {
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL: databaseUrl,
    AUTH_URL: `http://localhost:${port}`,
    AUTH_TRUST_HOST: "true",
    AUTH_SECRET: "e2e-test-secret-soundwave-32chars",
    AUTH_COOKIE_NAME: cookieName,
  },
  cwd: appDir,
  shell: true,
});
