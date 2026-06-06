# Soundwave Music Store — API Documentation

> **What is API documentation, and who reads it?**
> An API (Application Programming Interface) is the set of URLs ("endpoints") that the server
> exposes so that browser code, mobile apps, or other programs can ask it to do things —
> "give me all products", "add this item to my cart", "place this order".
> API documentation is the contract between whoever built the server and whoever is calling it.
> Your tutor reads it to understand what the backend can do without having to read all the code.
> A new developer on the team reads it to know how to call the server without guessing.
>
> **What is an "API contract"?**
> A contract defines: what URL to call, what data to send, and what data you get back.
> If the server says `POST /api/cart` returns `{ ok: true }` on success, every caller can
> rely on that shape. Changing it without updating the contract (a "breaking change") would
> break every client that depends on it.
>
> **Session-cookie auth vs Bearer token auth**
> This app uses **session cookies**. When you log in, the server sets an `httpOnly` cookie —
> a value stored in the browser that is automatically sent with every request to the same
> domain. "httpOnly" means JavaScript on the page cannot read it, so it can't be stolen by
> an XSS attack. Bearer tokens (used in many mobile APIs) are strings the client stores in
> memory or localStorage and sends manually in an `Authorization: Bearer <token>` header.
> They are more portable (work across domains) but are exposed to JavaScript, making them
> riskier if XSS is a concern. Cookies are the safer default for web-only apps.
>
> **Why Markdown instead of Swagger UI?**
> Swagger UI generates interactive docs from a machine-readable spec (OpenAPI JSON/YAML).
> It is valuable when a large team or external developers need to test endpoints live from the
> browser. For a student project with a small codebase and a single reviewer, plain Markdown
> is faster to write, easier to read, and requires no tooling. You would add Swagger when the
> API grows large enough that keeping a Markdown doc up-to-date becomes error-prone.

---

## Conventions

| | |
|---|---|
| **Store base URL** | `https://soundwave-store.vercel.app` |
| **Admin base URL** | `https://soundwave-admin.vercel.app` |
| **Local dev (store)** | `http://localhost:3000` |
| **Local dev (admin)** | `http://localhost:3001` |
| **Auth mechanism** | `httpOnly` session cookie set by NextAuth on sign-in |
| **Request body format** | `Content-Type: application/json` |
| **Response body format** | JSON |

### Auth levels used in this document

| Label | Meaning |
|---|---|
| **Public** | No login required |
| **User** | Must be logged in (any role) |
| **Admin** | Must be logged in with `role = "ADMIN"` |

### Standard error shape

Every error response uses this JSON shape:

```json
{
  "error": "Human-readable message.",
  "details": { "fieldName": ["Validation error text."] }
}
```

`details` is only present on validation errors (HTTP 400). All other errors omit it.

### Status codes used

| Code | Meaning |
|---|---|
| `200` | OK — request succeeded, response body contains data |
| `201` | Created — a new resource was created |
| `204` | No Content — request succeeded, no body returned |
| `400` | Bad Request — invalid input or business rule violation |
| `401` | Unauthorized — no valid session cookie |
| `403` | Forbidden — session exists but role is insufficient |
| `404` | Not Found — the requested resource does not exist |
| `409` | Conflict — the resource already exists (duplicate) |
| `500` | Server Error — unexpected failure |

---

## Schemas

These TypeScript types describe every entity in the system. They are the "contract" — what the
database stores and what the API sends and receives.

```ts
// ── Product ────────────────────────────────────────────────────────────────────
// Stored in DB with priceInCents (integer). API responses convert to dollars.

type Product = {
  id:           string;   // cuid() — e.g. "clxyz123abc"
  title:        string;
  artist:       string;
  genre:        "ROCK" | "JAZZ" | "HIP_HOP" | "ELECTRONIC"; // DB storage value
  priceInCents: number;   // e.g. 999 = $9.99 (avoids float precision bugs)
  stockQty:     number;   // current inventory; decremented on checkout
  imageUrl:     string;   // full URL, defaults to picsum.photos if blank
  previewUrl:   string;   // audio preview; defaults to "/preview-placeholder.mp3"
  createdAt:    string;   // ISO 8601 date string
};

// The store API response converts to "UI format" for display:
type ProductUI = Omit<Product, "genre" | "priceInCents" | "stockQty"> & {
  genre:  "Rock" | "Jazz" | "Hip-Hop" | "Electronic"; // display label
  price:  number;   // dollars (e.g. 9.99)
  stock:  number;   // same as stockQty
};

// ── User ───────────────────────────────────────────────────────────────────────
type User = {
  id:        string;
  name:      string;
  email:     string;
  role:      "USER" | "ADMIN";
  createdAt: string;   // ISO 8601
  // password is NEVER returned in any API response
};

// ── Order ──────────────────────────────────────────────────────────────────────
type Order = {
  id:         string;
  status:     "PENDING" | "PAID" | "CANCELLED";
  totalCents: number;   // sum of (unitPriceCents × quantity) for all items
  createdAt:  string;   // ISO 8601
  items:      OrderItem[];
};

// ── OrderItem ──────────────────────────────────────────────────────────────────
type OrderItem = {
  productId:      string;
  title:          string;   // snapshot of product title at purchase time
  artist:         string;
  quantity:       number;
  unitPriceCents: number;   // price at time of purchase; immutable after checkout
};

// ── CartItem ───────────────────────────────────────────────────────────────────
// Returned by GET /api/cart. The cart item's key is the product id.
type CartItem = {
  id:       string;   // = productId
  title:    string;
  artist:   string;
  price:    number;   // dollars (converted from priceInCents)
  quantity: number;
};

// ── ErrorResponse ──────────────────────────────────────────────────────────────
type ErrorResponse = {
  error:    string;
  details?: Record<string, string[]>;   // field-level validation errors
};
```

---

## Store API

Base URL: `https://soundwave-store.vercel.app`

---

### POST /api/auth/register

**Auth:** Public — no login required  
**Description:** Creates a new customer account.

#### Request body

```json
{
  "name":     "string — display name",
  "email":    "string — must be a valid email",
  "password": "string — min 8 characters"
}
```

#### Responses

| Status | Body |
|--------|------|
| `201` | `{ "user": { "id", "name", "email", "role", "createdAt" } }` |
| `400` | `ErrorResponse` — validation failed (see `details` for per-field errors) |
| `409` | `ErrorResponse` — email address already registered |
| `500` | `ErrorResponse` — unexpected server error |

#### Example

```bash
curl -X POST https://soundwave-store.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"secret99"}'
```

---

### POST /api/auth/\[...nextauth\]

**Auth:** Public  
**Description:** NextAuth.js catch-all route. Handles sign-in (`POST /api/auth/signin`),
sign-out (`POST /api/auth/signout`), and session reads (`GET /api/auth/session`).
You do not call these directly — the `signIn()` and `signOut()` helpers from
`next-auth/react` call them for you.

---

### GET /api/products

**Auth:** Public  
**Description:** Returns all products, optionally filtered by search query and/or genre.

#### Query parameters

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Filter by title or artist (case-insensitive, partial match) |
| `genre` | string | Filter by genre — one of `ROCK`, `JAZZ`, `HIP_HOP`, `ELECTRONIC` (or `all` / omit for no filter) |

#### Responses

| Status | Body |
|--------|------|
| `200` | Array of `ProductUI` objects |
| `500` | `ErrorResponse` |

#### Example

```bash
# All products
curl https://soundwave-store.vercel.app/api/products

# Search for "neon" in any genre
curl "https://soundwave-store.vercel.app/api/products?search=neon"

# Jazz albums only
curl "https://soundwave-store.vercel.app/api/products?genre=JAZZ"

# Combined filter
curl "https://soundwave-store.vercel.app/api/products?search=blue&genre=JAZZ"
```

---

### GET /api/products/\[id\]

**Auth:** Public  
**Description:** Returns a single product by its ID, including `stockQty`.

#### Path parameter

| Param | Type | Description |
|-------|------|-------------|
| `id` | string | The product's cuid — e.g. `clxyz123abc` |

#### Responses

| Status | Body |
|--------|------|
| `200` | `ProductUI & { stockQty: number }` |
| `404` | `ErrorResponse` — product not found |
| `500` | `ErrorResponse` |

#### Example

```bash
curl https://soundwave-store.vercel.app/api/products/clxyz123abc
```

---

### GET /api/cart

**Auth:** User  
**Description:** Returns the current user's cart items joined with product details.

#### Responses

| Status | Body |
|--------|------|
| `200` | Array of `CartItem` |
| `401` | `ErrorResponse` — not logged in |

#### Example

```bash
# The cookie is sent automatically by the browser; curl needs --cookie
curl https://soundwave-store.vercel.app/api/cart \
  --cookie "store.session-token=<YOUR_SESSION_TOKEN>"
```

---

### POST /api/cart

**Auth:** User  
**Description:** Adds a product to the cart. If the product is already in the cart,
increments its quantity by 1 (upsert).

#### Request body

```json
{ "productId": "string — the product's cuid" }
```

#### Responses

| Status | Body |
|--------|------|
| `200` | `{ "ok": true }` |
| `400` | `ErrorResponse` — missing or invalid `productId` |
| `401` | `ErrorResponse` — not logged in |
| `404` | `ErrorResponse` — product not found |

#### Example

```js
await fetch("/api/cart", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ productId: "clxyz123abc" }),
});
```

---

### PUT /api/cart/\[productId\]

**Auth:** User  
**Description:** Sets the quantity of a specific cart item to an explicit value.
Sending `quantity: 0` removes the item (same effect as DELETE).

#### Path parameter

| Param | Type | Description |
|-------|------|-------------|
| `productId` | string | The product's cuid (used as the cart item key) |

#### Request body

```json
{ "quantity": 2 }
```

#### Responses

| Status | Body |
|--------|------|
| `200` | `{ "ok": true }` |
| `204` | Empty — item was removed (quantity was 0) |
| `400` | `ErrorResponse` — validation error |
| `401` | `ErrorResponse` — not logged in |
| `404` | `ErrorResponse` — cart item not found |

#### Example

```js
await fetch("/api/cart/clxyz123abc", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ quantity: 3 }),
});
```

---

### DELETE /api/cart/\[productId\]

**Auth:** User  
**Description:** Removes a single product from the cart completely.

#### Path parameter

| Param | Type | Description |
|-------|------|-------------|
| `productId` | string | The product's cuid |

#### Responses

| Status | Body |
|--------|------|
| `204` | Empty — item removed |
| `401` | `ErrorResponse` — not logged in |

#### Example

```js
await fetch("/api/cart/clxyz123abc", { method: "DELETE" });
```

---

### POST /api/checkout

**Auth:** User  
**Description:** Places an order for everything in the user's cart.

The server re-reads prices from the database — the client sends no amounts.
This prevents price manipulation (a user sending `{ total: 0.01 }`).

The entire operation runs in a single database **transaction**:
1. Validates stock for every item.
2. Creates the `Order` row with `status: "PAID"`.
3. Creates one `OrderItem` per cart item, snapshotting the unit price.
4. Decrements each product's `stockQty`.
5. Clears the user's cart.

If any step fails (e.g. stock runs out mid-transaction), all steps are rolled back
and the cart is unchanged.

> **Note on payment:** This project uses a **mock checkout** — no real card processing
> occurs. In a production app, the order would be created as `PENDING` and a payment
> processor (e.g. Stripe) would flip it to `PAID` via a webhook after the card is charged.

#### Request body

None — the server reads the cart from the database.

#### Responses

| Status | Body |
|--------|------|
| `200` | `{ "orderId": "string" }` |
| `400` | `ErrorResponse` — cart is empty, or a product is out of stock |
| `401` | `ErrorResponse` — not logged in |
| `500` | `ErrorResponse` — unexpected server error |

#### Example

```js
const res = await fetch("/api/checkout", { method: "POST" });
const { orderId } = await res.json();
// Navigate to /checkout/success
```

---

### GET /api/orders/mine

**Auth:** User  
**Description:** Returns the current user's full order history, newest first.
The endpoint name `/mine` is intentional — there is no user ID in the URL.
The server always reads the user ID from the session, which means it is
structurally impossible for a user to request another user's orders.
(A URL pattern like `/api/orders/[userId]` would require an explicit ownership
check; forgetting that check is a common security bug called IDOR —
Insecure Direct Object Reference.)

#### Responses

| Status | Body |
|--------|------|
| `200` | Array of `Order` (each includes `items` array with product titles) |
| `401` | `ErrorResponse` — not logged in |

#### Example

```js
const res = await fetch("/api/orders/mine");
const orders = await res.json();
// orders[0].items[0].title — first item of most recent order
```

---

## Admin API

Base URL: `https://soundwave-admin.vercel.app`

All admin endpoints require an authenticated session with `role = "ADMIN"`.
Regular customers (role `USER`) receive a `403 Forbidden` response.

---

### GET /api/products *(Admin)*

**Auth:** Admin  
**Description:** Lists all products in the database, newest first.
Returns the full product list in UI format (price in dollars, display genre labels).

#### Responses

| Status | Body |
|--------|------|
| `200` | Array of `ProductUI & { stock: number }` |
| `401` | `ErrorResponse` |
| `403` | `ErrorResponse` |

#### Example

```bash
curl https://soundwave-admin.vercel.app/api/products \
  --cookie "admin.session-token=<SESSION>"
```

---

### POST /api/products *(Admin)*

**Auth:** Admin  
**Description:** Creates a new product. Accepts prices in dollars; the server converts
to cents before writing to the database.

#### Request body

```json
{
  "title":      "string — required",
  "artist":     "string — required",
  "genre":      "Rock | Jazz | Hip-Hop | Electronic",
  "price":      9.99,
  "stock":      50,
  "imageUrl":   "string — URL or empty string (auto-generates picsum URL if blank)",
  "previewUrl": "string — defaults to /preview-placeholder.mp3"
}
```

#### Responses

| Status | Body |
|--------|------|
| `201` | `ProductUI & { stock: number }` — the created product |
| `400` | `ErrorResponse` — validation failed |
| `401` | `ErrorResponse` |
| `403` | `ErrorResponse` |
| `409` | `ErrorResponse` — a product with that title + artist already exists |
| `500` | `ErrorResponse` |

#### Example

```js
const res = await fetch("/api/products", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    title: "Dark Side of the Moon",
    artist: "Pink Floyd",
    genre: "Rock",
    price: 14.99,
    stock: 100,
    imageUrl: "",
  }),
});
const created = await res.json(); // { id, title, artist, genre, price, stock, ... }
```

---

### PUT /api/products/\[id\] *(Admin)*

**Auth:** Admin  
**Description:** Replaces all fields of an existing product. This is a full update (PUT),
not a partial update (PATCH) — all fields are required. The admin modal always
sends every field, so partial updates aren't needed.

#### Path parameter

| Param | Type | Description |
|-------|------|-------------|
| `id` | string | The product's cuid |

#### Request body

Same shape as `POST /api/products`.

#### Responses

| Status | Body |
|--------|------|
| `200` | `ProductUI & { stock: number }` — the updated product |
| `400` | `ErrorResponse` — validation failed |
| `401` | `ErrorResponse` |
| `403` | `ErrorResponse` |
| `404` | `ErrorResponse` — product not found |
| `409` | `ErrorResponse` — title + artist conflict |
| `500` | `ErrorResponse` |

#### Example

```js
await fetch("/api/products/clxyz123abc", {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ title: "Updated Title", artist: "...", /* all fields */ }),
});
```

---

### DELETE /api/products/\[id\] *(Admin)*

**Auth:** Admin  
**Description:** Permanently deletes a product by ID.

#### Path parameter

| Param | Type | Description |
|-------|------|-------------|
| `id` | string | The product's cuid |

#### Responses

| Status | Body |
|--------|------|
| `204` | Empty — deleted |
| `401` | `ErrorResponse` |
| `403` | `ErrorResponse` |
| `404` | `ErrorResponse` — product not found |
| `500` | `ErrorResponse` |

#### Example

```js
await fetch("/api/products/clxyz123abc", { method: "DELETE" });
// 204 means success — no body to read
```

---

### GET /api/admin/orders *(Admin)*

**Auth:** Admin  
**Description:** Returns every order in the system (all customers) with full customer
and item details. This endpoint exists for programmatic access (e.g. a future mobile
admin app or reporting tool). The admin web UI queries the database directly from a
Server Component and does not call this endpoint.

#### Responses

| Status | Body |
|--------|------|
| `200` | Array of extended `Order` objects (see shape below) |
| `401` | `ErrorResponse` |
| `403` | `ErrorResponse` |

#### Response item shape

```json
{
  "id":         "clxyz123abc",
  "status":     "PAID",
  "totalCents": 2997,
  "createdAt":  "2025-06-01T10:30:00.000Z",
  "customer": {
    "id":    "user-cuid",
    "name":  "Alice Smith",
    "email": "alice@example.com"
  },
  "itemCount": 2,
  "items": [
    { "title": "Neon Horizon", "quantity": 1, "unitPriceCents": 999 },
    { "title": "Pulse Drive",  "quantity": 2, "unitPriceCents": 999 }
  ]
}
```

#### Example

```bash
curl https://soundwave-admin.vercel.app/api/admin/orders \
  --cookie "admin.session-token=<SESSION>"
```

---

## Authentication & Authorization

### How session cookies work

When a user calls `POST /api/auth/signin` (via NextAuth's `signIn()` helper),
NextAuth verifies the email and password, then sets an **httpOnly session cookie**
(`store.session-token` for the store, `admin.session-token` for the admin).
The cookie contains a signed and encrypted JWT — a compact token that encodes
the user's `id`, `email`, `name`, and `role` without any database lookup on subsequent
requests.

On every future request, the browser automatically includes the cookie in the request
headers. The server calls `auth()` (NextAuth's session helper) which decrypts the JWT
and returns the user's session. No database read is required for every request — all
the identity information is in the cookie itself.

The cookie is `httpOnly`, meaning JavaScript running on the page **cannot read it**.
This protects against XSS attacks — even if an attacker injects malicious script into
the page, they cannot steal the session token.

Cookies are scoped to their domain. Because the store (`localhost:3000`) and admin
(`localhost:3001`) run on the same `localhost` domain in development, they are given
different cookie names so sessions are not shared between the two apps.

### How admin role is enforced

There are two complementary layers:

1. **Middleware (`middleware.ts`)** — runs before any admin page renders. It reads
   the JWT from the session cookie and checks that `session.user.role === "ADMIN"`.
   Any request without a valid ADMIN session is redirected to `/login` before the
   page component even starts. Middleware runs in Edge Runtime — it uses an
   edge-safe NextAuth config that only verifies the JWT token (no database access).

2. **Per-route check (`requireAdmin()`)** — every admin API route calls
   `requireAdmin()` at its very first line. This returns a `403 Forbidden` response
   if the session is missing or the role is not `ADMIN`. The API layer is protected
   independently of the UI layer — calling an admin API endpoint directly (bypassing
   the web UI) still receives the same auth check.

The two layers together mean that both the UI pages and the raw API endpoints are
protected, with no single point of failure.

---

## Webhook Verification

> **Note for this project:** This version of Soundwave uses a **mock checkout** with
> no real payment processor. The Stripe integration (and its webhook) was intentionally
> removed for simplicity. The section below explains what webhook verification would
> look like in a real production app — included here for learning purposes.

In a production app, when a customer's payment is processed by Stripe, Stripe
calls your server at `POST /api/webhooks/stripe` to report the result. Because this
URL is public (Stripe needs to reach it from the internet), anyone could send a fake
request to it claiming a payment succeeded.

**Webhook signature verification** prevents this. Stripe signs every webhook request
with a secret key (your `STRIPE_WEBHOOK_SECRET`). Your server uses this key to verify
the request really came from Stripe:

```ts
const event = stripe.webhooks.constructEvent(
  rawBody,           // the raw request body bytes
  req.headers["stripe-signature"],  // signature header Stripe adds
  process.env.STRIPE_WEBHOOK_SECRET // your secret key
);
```

If the signature doesn't match, `constructEvent` throws and the handler returns
`400 Bad Request`. If it matches, the handler can safely trust the event.
The `rawBody` must be the **raw, un-parsed** bytes of the request — parsing the
JSON first changes the byte sequence and invalidates the signature.

This pattern (sign outgoing requests, verify on arrival) is standard for all
webhook-based integrations (Stripe, GitHub, Twilio, etc.).
