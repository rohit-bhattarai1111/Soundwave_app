/** @type {import('next').NextConfig} */
const nextConfig = {
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
    // serverComponentsExternalPackages tells Next.js not to bundle these
    // packages — they are kept as native Node require() calls at runtime.
    // (This option was renamed to `serverExternalPackages` in Next.js 15;
    //  we are on 14.x so we use the experimental name here.)
    //
    // WHY? @libsql/client and its transitive dep `libsql` are Node.js-only.
    // libsql uses a dynamic require() with a glob pattern (sync ^\.\/.*$)
    // that causes webpack to try bundling every file in the package directory,
    // including README.md and LICENSE — webpack then crashes with "Module parse
    // failed" because those aren't JavaScript.
    //
    // Belt-and-suspenders: client.ts ALSO uses eval("require") so webpack
    // never even sees the import statically. This config is a safety net.
    serverComponentsExternalPackages: [
      "@libsql/client",
      "@prisma/adapter-libsql",
      "libsql",
    ],
  },
};

export default nextConfig;
