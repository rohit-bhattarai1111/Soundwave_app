/** @type {import('next').NextConfig} */
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Monorepo deps live at the repo root; without this, Vercel omits @libsql/client from the bundle.
const monorepoRoot = path.join(__dirname, "../..");

const nextConfig = {
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
    outputFileTracingRoot: monorepoRoot,
    serverComponentsExternalPackages: [
      "@libsql/client",
      "@prisma/adapter-libsql",
      "libsql",
    ],
    outputFileTracingIncludes: {
      "/*": [
        "../../node_modules/@libsql/**/*",
        "../../node_modules/.pnpm/@libsql+*/**/*",
        "../../node_modules/.pnpm/libsql@*/**/*",
        "../../node_modules/.pnpm/@prisma+adapter-libsql@*/**/*",
        "../../node_modules/.pnpm/@libsql+linux-x64-gnu@*/**/*",
        "../../node_modules/.pnpm/@libsql+linux-x64-musl@*/**/*",
      ],
    },
  },

  // serverComponentsExternalPackages only matches exact package names.
  // libsql's internal files and sub-packages slip through as webpack resolves
  // require("@libsql/client") into lib-cjs/node.js → sqlite3.js → libsql/index.js,
  // which contains a dynamic require() for native .node binaries that webpack
  // cannot bundle. This function external intercepts the full chain.
  webpack(config, { isServer }) {
    if (isServer) {
      const existing = Array.isArray(config.externals)
        ? config.externals
        : config.externals
          ? [config.externals]
          : [];

      config.externals = [
        ...existing,
        ({ request }, callback) => {
          if (
            request === "libsql" ||
            request.startsWith("libsql/") ||
            request === "@libsql/client" ||
            request.startsWith("@libsql/client/") ||
            request === "@prisma/adapter-libsql" ||
            request.startsWith("@prisma/adapter-libsql/")
          ) {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        },
      ];
    }
    return config;
  },
};

export default nextConfig;
