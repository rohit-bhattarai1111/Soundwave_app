-- Migration: initial schema
-- Generated from packages/db/prisma/schema.prisma
-- All enum-like fields are TEXT (SQLite has no native enum type in Prisma 5.x).

-- ─── Core application tables ──────────────────────────────────────────────────

CREATE TABLE "User" (
    "id"        TEXT NOT NULL PRIMARY KEY,
    "email"     TEXT NOT NULL,
    "password"  TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "role"      TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Product" (
    "id"           TEXT     NOT NULL PRIMARY KEY,
    "title"        TEXT     NOT NULL,
    "artist"       TEXT     NOT NULL,
    "genre"        TEXT     NOT NULL,
    "priceInCents" INTEGER  NOT NULL,
    "stockQty"     INTEGER  NOT NULL DEFAULT 0,
    "imageUrl"     TEXT     NOT NULL,
    "previewUrl"   TEXT     NOT NULL,
    "createdAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "CartItem" (
    "userId"    TEXT    NOT NULL,
    "productId" TEXT    NOT NULL,
    "quantity"  INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "CartItem_userId_fkey"    FOREIGN KEY ("userId")    REFERENCES "User"    ("id") ON DELETE CASCADE  ON UPDATE CASCADE,
    CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Order" (
    "id"                    TEXT     NOT NULL PRIMARY KEY,
    "userId"                TEXT     NOT NULL,
    "totalCents"            INTEGER  NOT NULL,
    "status"                TEXT     NOT NULL DEFAULT 'PENDING',
    "stripePaymentIntentId" TEXT,
    "createdAt"             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "OrderItem" (
    "id"            TEXT    NOT NULL PRIMARY KEY,
    "orderId"       TEXT    NOT NULL,
    "productId"     TEXT    NOT NULL,
    "quantity"      INTEGER NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    CONSTRAINT "OrderItem_orderId_fkey"   FOREIGN KEY ("orderId")   REFERENCES "Order"   ("id") ON DELETE CASCADE  ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ─── NextAuth.js tables ───────────────────────────────────────────────────────

CREATE TABLE "Account" (
    "id"                TEXT    NOT NULL PRIMARY KEY,
    "userId"            TEXT    NOT NULL,
    "type"              TEXT    NOT NULL,
    "provider"          TEXT    NOT NULL,
    "providerAccountId" TEXT    NOT NULL,
    "refresh_token"     TEXT,
    "access_token"      TEXT,
    "expires_at"        INTEGER,
    "token_type"        TEXT,
    "scope"             TEXT,
    "id_token"          TEXT,
    "session_state"     TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Session" (
    "id"           TEXT     NOT NULL PRIMARY KEY,
    "sessionToken" TEXT     NOT NULL,
    "userId"       TEXT     NOT NULL,
    "expires"      DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "VerificationToken" (
    "identifier" TEXT     NOT NULL,
    "token"      TEXT     NOT NULL,
    "expires"    DATETIME NOT NULL
);

-- ─── Unique indexes ───────────────────────────────────────────────────────────

CREATE UNIQUE INDEX "User_email_key"                          ON "User"              ("email");
CREATE UNIQUE INDEX "Product_title_artist_key"                ON "Product"           ("title", "artist");
CREATE UNIQUE INDEX "CartItem_userId_productId_key"           ON "CartItem"          ("userId", "productId");
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key"  ON "Account"           ("provider", "providerAccountId");
CREATE UNIQUE INDEX "Session_sessionToken_key"                ON "Session"           ("sessionToken");
CREATE UNIQUE INDEX "VerificationToken_token_key"             ON "VerificationToken" ("token");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key"  ON "VerificationToken" ("identifier", "token");
