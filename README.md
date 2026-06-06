# Soundwave

[![CI](https://github.com/rohit-bhattarai1111/Soundwave_app/actions/workflows/ci.yml/badge.svg)](https://github.com/rohit-bhattarai1111/Soundwave_app/actions/workflows/ci.yml)

A full-stack B2C music store built as a learning project across two iterations.
**Iteration 2** is complete — real database (SQLite via Turso), REST API, production
auth (NextAuth.js), CI pipeline, and deployment to Vercel.

The project is a Turborepo monorepo containing two Next.js 14 apps — a customer-facing
store and an internal admin dashboard — that share a common UI package.

---

## Screenshots

| Store | Admin |
|---|---|
| ![Store](./docs/store-screenshot.png) | ![Admin](./docs/admin-screenshot.png) |

> Screenshots coming soon — add real images to `docs/` and update the paths above.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Monorepo tooling | [Turborepo](https://turborepo.dev) |
| Apps | [Next.js 14](https://nextjs.org) (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| State management | React Context + `useReducer` |
| Package manager | pnpm workspaces |
| CI | GitHub Actions |

---

## Folder Structure

```
soundwave/                     ← monorepo root
├── .github/
│   └── workflows/
│       └── ci.yml             ← GitHub Actions CI pipeline
├── apps/
│   ├── store/                 ← Customer-facing music store  (port 3000)
│   │   ├── app/               ← Next.js App Router pages
│   │   ├── components/        ← Store-specific UI components
│   │   └── contexts/          ← CartContext, UserContext
│   └── admin/                 ← Internal admin dashboard     (port 3001)
│       ├── app/               ← Next.js App Router pages
│       ├── components/        ← Admin-specific UI components
│       ├── contexts/          ← AuthContext, ProductsContext
│       └── lib/               ← Mock data (replaced by DB in iteration 2)
└── packages/
    ├── ui/                    ← Shared UI components (@soundwave/ui)
    ├── eslint-config/         ← Shared ESLint rules (@repo/eslint-config)
    └── typescript-config/     ← Shared tsconfig (@repo/typescript-config)
```

---

## Getting Started

**Prerequisites:** Node.js ≥ 18, pnpm ≥ 9

**Install dependencies** (run once from the repo root):

```sh
pnpm install
```

**Run both apps simultaneously:**

```sh
pnpm run dev
```

Turborepo starts both apps in parallel. Open them in your browser:

| App | URL |
|---|---|
| Store | http://localhost:3000 |
| Admin | http://localhost:3001 |

**Build for production:**

```sh
pnpm run build
```

**Lint all packages:**

```sh
pnpm run lint
```

**Run a single app only:**

```sh
pnpm turbo dev --filter=store
pnpm turbo dev --filter=admin
```

---

## Admin Login

The admin dashboard uses **hardcoded credentials** for Iteration 1 (no database yet).

| Field | Value |
|---|---|
| Email | `admin@soundwave.com` |
| Password | `admin123` |

> **Iteration 2 note:** These credentials will be replaced with a real authentication
> system using bcrypt password hashing and HTTP-only session cookies. Never use
> hardcoded credentials in production.

---

## Project Status

### Iteration 1 — Frontend Complete

| Feature | Status |
|---|---|
| Product catalogue (store) | Done |
| Shopping cart (Context + useReducer) | Done |
| Checkout flow + order success page | Done |
| Customer login / register (mock) | Done |
| Admin login (hardcoded credentials) | Done |
| Products CRUD (in-memory state) | Done |
| Orders table (mock data) | Done |
| CI pipeline (GitHub Actions) | Done |

### Iteration 2 — Backend (upcoming)

- PostgreSQL database (Prisma ORM)
- REST API routes (`/api/products`, `/api/orders`, `/api/auth`)
- Real authentication — bcrypt hashing, HTTP-only session cookies
- Server-side validation (not just client-side)
- Image uploads (replace picsum.photos placeholders)
- Deployment (Vercel / Railway)

---

## API Documentation

The full REST API reference — every endpoint, request body, response shape, and example
curl/fetch snippet — is in **[docs/API.md](./docs/API.md)**.

Covered in that document:
- Store public API: products, cart, checkout, orders
- Admin API: product CRUD, order listing
- Authentication model (session cookies, role enforcement)
- Beginner explainers: what an API contract is, cookies vs Bearer tokens, when to use Swagger

---

## Beginner Explainer

### What is Turborepo?

Think of Turborepo as a **traffic controller for a big project made of many smaller
projects**. Without it, running two separate websites means opening two terminal windows
and starting each one by hand. Turborepo lets you type `pnpm run dev` once and it starts
*all* your apps in parallel. It also remembers which parts of your code already built
successfully and skips re-building them — like a smart cache that saves time on every run.

### What is the `packages/` folder for?

The `packages/` folder holds **code shared between both apps**. Imagine you design a
button component. Without a shared package, you'd copy-paste it into both `store/` and
`admin/`. If you later want to change its colour, you'd have to update it in two places.
With `packages/ui`, you write the button *once*, both apps import it, and a single change
updates everywhere instantly.

### Why two separate Next.js apps instead of one?

The store and admin have **very different audiences and security requirements**:

- **Store** (`apps/store`) — public-facing, needs fast load times and great SEO for
  customers browsing albums.
- **Admin** (`apps/admin`) — internal tool, only staff access it, needs a login wall,
  completely different visual design, and tighter security rules.

Keeping them as separate apps means:
1. You can deploy them independently (admin behind a VPN, store on a public CDN).
2. A bug in the admin cannot crash the customer store.
3. Each app only ships the JavaScript it actually needs — no bloat.
4. Different developers can own each app without merge conflicts.

The `packages/` folder bridges them — shared code lives there, app-specific code stays
inside each app.
