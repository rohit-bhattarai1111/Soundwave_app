import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const monorepoRoot = resolve(__dirname, "../../..");
const source = resolve(monorepoRoot, "node_modules/.prisma/client");

if (!existsSync(source)) {
  console.warn("[sync-prisma-client] No generated client at", source);
  process.exit(0);
}

const prismaClientPkg = dirname(
  require.resolve("@prisma/client/package.json", { paths: [resolve(__dirname, "..")] })
);
const target = resolve(prismaClientPkg, "../../.prisma/client");

mkdirSync(dirname(target), { recursive: true });
try {
  cpSync(source, target, { recursive: true });
  console.log("[sync-prisma-client] Synced client to", target);
} catch (err) {
  const code = err && typeof err === "object" && "code" in err ? err.code : "";
  if (code === "EPIPE" || code === "EBUSY" || code === "EPERM") {
    console.warn(
      "[sync-prisma-client] Could not sync (dev server may be running).",
      "Stop `pnpm dev`, then run `pnpm --filter @repo/db run db:generate` again."
    );
    process.exit(0);
  }
  throw err;
}
