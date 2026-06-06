-- Preserve order line details when admins delete products.
-- Rebuilds OrderItem (nullable productId + SET NULL) and CartItem (CASCADE on product).

PRAGMA foreign_keys=OFF;

CREATE TABLE "OrderItem_new" (
    "id"             TEXT    NOT NULL PRIMARY KEY,
    "orderId"        TEXT    NOT NULL,
    "productId"      TEXT,
    "productTitle"   TEXT    NOT NULL,
    "productArtist"  TEXT    NOT NULL,
    "quantity"       INTEGER NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "OrderItem_new" (
    "id", "orderId", "productId", "productTitle", "productArtist", "quantity", "unitPriceCents"
)
SELECT
    oi."id",
    oi."orderId",
    oi."productId",
    p."title",
    p."artist",
    oi."quantity",
    oi."unitPriceCents"
FROM "OrderItem" oi
INNER JOIN "Product" p ON p."id" = oi."productId";

DROP TABLE "OrderItem";
ALTER TABLE "OrderItem_new" RENAME TO "OrderItem";

CREATE TABLE "CartItem_new" (
    "userId"    TEXT    NOT NULL,
    "productId" TEXT    NOT NULL,
    "quantity"  INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "CartItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "CartItem_new" ("userId", "productId", "quantity")
SELECT "userId", "productId", "quantity" FROM "CartItem";

DROP TABLE "CartItem";
ALTER TABLE "CartItem_new" RENAME TO "CartItem";

CREATE UNIQUE INDEX "CartItem_userId_productId_key" ON "CartItem" ("userId", "productId");

PRAGMA foreign_keys=ON;
