/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow Next.js Image to load photos from picsum.photos.
  // Without this allowlist, next/image blocks all external URLs as a security measure.
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
    // Same as apps/store — prevent webpack from bundling Node-only libsql packages.
    // See apps/store/next.config.js for the full explanation.
    // Note: renamed to `serverExternalPackages` in Next.js 15; on 14.x use experimental.
    serverComponentsExternalPackages: [
      "@libsql/client",
      "@prisma/adapter-libsql",
      "libsql",
    ],
  },
};

export default nextConfig;
