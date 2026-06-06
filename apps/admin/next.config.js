/** @type {import('next').NextConfig} */
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
      "@prisma/client",
      "@libsql/client",
      "@prisma/adapter-libsql",
      "libsql",
    ],
    outputFileTracingIncludes: {
      "/*": ["../../node_modules/.prisma/client/**/*"],
    },
  },

  // See apps/store/next.config.js for explanation.
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
            request.startsWith("@prisma/adapter-libsql/") ||
            request === "@prisma/client" ||
            request.startsWith("@prisma/client/")
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
