/** @type {import('next').NextConfig} */
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
    serverComponentsExternalPackages: [
      "@libsql/client",
      "@prisma/adapter-libsql",
      "libsql",
    ],
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
