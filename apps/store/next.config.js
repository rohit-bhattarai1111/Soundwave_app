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
};

export default nextConfig;
