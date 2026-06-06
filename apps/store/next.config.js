import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
<<<<<<< HEAD
=======
  // Tell Next.js that node_modules live at the monorepo root, not inside apps/store.
  // Without this, the Vercel function bundle misses @libsql/client and @prisma/adapter-libsql
  // because they're in ../../node_modules, which Next.js's file tracer won't look in by default.
  outputFileTracingRoot: path.join(__dirname, "../../"),

>>>>>>> 531b3fed8d1f54a505a6e961303f3746d971fe6f
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
<<<<<<< HEAD
    outputFileTracingRoot: path.join(__dirname, "../../"),
=======
>>>>>>> 531b3fed8d1f54a505a6e961303f3746d971fe6f
    serverComponentsExternalPackages: [
      "@libsql/client",
      "@prisma/adapter-libsql",
      "libsql",
    ],
  },
};

export default nextConfig;
