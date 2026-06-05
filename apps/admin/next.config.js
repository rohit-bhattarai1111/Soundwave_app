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

  // Same as apps/store — prevent webpack from bundling Node-only libsql packages.
  // See apps/store/next.config.js for the full explanation.
  serverExternalPackages: ["@libsql/client", "@prisma/adapter-libsql"],
};

export default nextConfig;
