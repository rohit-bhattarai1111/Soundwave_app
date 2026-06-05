// client.ts — exports a singleton PrismaClient instance.
//
// WHY A SINGLETON?
// In production, we only ever want ONE database connection open.
// But in Next.js development mode, the server "hot-reloads" every time
// you save a file — it re-runs every module from scratch, which would
// create a brand-new PrismaClient (and a new connection) on every save.
// After a few reloads, you'd hit SQLite's connection limit and get errors.
//
// THE GLOBALTHIS PATTERN solves this:
// globalThis is a special JavaScript object that is NOT cleared on hot-reload.
// We store the PrismaClient on globalThis the first time it's created.
// On the next hot-reload, we find it already there and reuse it instead
// of creating a new one.

import { PrismaClient } from "@prisma/client";

// Extend the global type so TypeScript knows about our custom property.
// "unknown as { prisma: ... }" is a safe type cast — we know globalThis
// might have a prisma property in dev mode but TypeScript doesn't know that.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// If a PrismaClient already exists on globalThis, reuse it.
// If not (first startup or production), create a new one.
// The ?? operator means "use the right side if the left side is null or undefined".
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Read the DATABASE_URL from the environment.
    // In packages/db, this comes from packages/db/.env (loaded by Prisma CLI).
    // In Next.js apps, this comes from apps/store/.env.local.
    datasourceUrl: process.env.DATABASE_URL,

    // Uncomment the line below to log every SQL query — useful for debugging.
    // log: ["query", "info", "warn", "error"],
  });

// Only cache on globalThis in development.
// In production (Vercel, etc.), each serverless function starts fresh anyway
// and connection pooling is handled at the infrastructure level.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
