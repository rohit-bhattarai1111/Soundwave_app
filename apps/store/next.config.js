import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tell Next.js that node_modules live at the monorepo root, not inside apps/store.
  // Without this, the Vercel function bundle misses @libsql/client and @prisma/adapter-libsql
  // because they're in ../../node_modules, which Next.js's file tracer won't look in by default.
  outputFileTracingRoot: path.join(__dirname, "../../"),

  transpilePackages: ["@repo/auth", "@repo/db", "@soundwave/ui"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
    ],
  },

  experimental: {
    serverComponentsExternalPackages: [
      "@libsql/client",
      "@prisma/adapter-libsql",
      "libsql",
    ],
  },
};

export default nextConfig;
