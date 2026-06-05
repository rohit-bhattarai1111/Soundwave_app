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

  // WHY serverExternalPackages?
  // @libsql/client and @prisma/adapter-libsql are Node.js-only packages — they
  // use Node APIs like `net`, `tls`, and native bindings that don't exist in a
  // browser environment. Normally Next.js's webpack bundler analyses the full
  // import graph (even for server components) and tries to bundle everything it
  // finds. When webpack encounters @libsql/client it trips over non-JS files
  // in the package (README.md, native .node binaries) and crashes with
  // "Module parse failed: Unexpected token".
  //
  // serverExternalPackages tells Next.js: "don't bundle these — leave them as
  // Node require() calls at runtime". The packages are loaded by Node's native
  // module system when the serverless function starts, bypassing webpack entirely.
  // This is the standard fix for any Node-only dependency used in App Router.
  serverExternalPackages: ["@libsql/client", "@prisma/adapter-libsql"],
};

export default nextConfig;
