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
};

export default nextConfig;
