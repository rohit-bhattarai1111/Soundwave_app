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

// Hoisted installs (Vercel/CI) already place the client at the same path — skip copy.
if (resolve(source) === resolve(target)) {
  console.log("[sync-prisma-client] Source and target are the same — skipping sync");
  process.exit(0);
}

mkdirSync(dirname(target), { recursive: true });
try {
  cpSync(source, target, { recursive: true });
  console.log("[sync-prisma-client] Synced client to", target);
} catch (err) {
  const code = err && typeof err === "object" && "code" in err ? err.code : "";
  if (code === "EPIPE" || code === "EBUSY" || code === "EPERM" || code === "ERR_FS_CP_EINVAL") {
    console.warn(
      "[sync-prisma-client] Could not sync —",
      code === "ERR_FS_CP_EINVAL" ? "paths already identical (hoisted install)." : "dev server may be running."
    );
    process.exit(0);
  }
  throw err;
}
