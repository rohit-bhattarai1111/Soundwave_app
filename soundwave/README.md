# Soundwave — Turborepo Monorepo

A monorepo for the Soundwave music platform, managed with [Turborepo](https://turborepo.dev).

## Project Structure

```
soundwave/
├── apps/
│   ├── store/          # Customer-facing music store  (port 3000)
│   └── admin/          # Internal admin dashboard     (port 3001)
└── packages/
    └── ui/             # Shared UI components (@soundwave/ui)
```

## Getting Started

**Install dependencies** (run once from the repo root):

```sh
cd soundwave
npm install
```

**Run both apps at the same time:**

```sh
npm run dev
# store → http://localhost:3000
# admin → http://localhost:3001
```

**Build all apps for production:**

```sh
npm run build
```

**Run a single app only:**

```sh
npx turbo dev --filter=store
npx turbo dev --filter=admin
```

## Tech Stack

| Layer | Choice |
|-------|--------|
| Monorepo | Turborepo |
| Apps | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Package manager | npm workspaces |

---

## Beginner Explainer

### What is Turborepo?

Think of Turborepo as a **traffic controller for a big project made of many smaller projects**. Normally if you have two separate websites, you'd open two terminal windows and run each one manually. Turborepo lets you type a single command (`npm run dev`) and it starts *all* your apps at the same time. It also remembers which parts of your code already built successfully, so it skips re-running things that haven't changed — like a smart build cache.

### What is the `packages/` folder for?

The `packages/` folder holds **code that is shared between your apps**. Imagine you design a button component. Without a shared package, you'd copy-paste that button into both `store/` and `admin/`. If you later want to change its colour, you'd have to update it in two places and hope you don't forget one. With `packages/ui`, you write the button **once**, both apps import it, and a single change updates everywhere instantly.

### Why two separate Next.js apps instead of one?

The store and admin have **very different audiences and requirements**:

- **Store** (`apps/store`) — public-facing, needs SEO, fast load times, attractive design for customers.
- **Admin** (`apps/admin`) — internal tool, only staff can access it, needs a login wall, different security rules, a completely different visual layout.

Keeping them as separate apps means:
1. You can deploy them independently (e.g. admin behind a VPN, store on a CDN).
2. A bug in the admin code cannot crash the store.
3. Each app only ships the code it actually needs — no bloat.
4. Different teams can own each app without stepping on each other.

The `packages/` folder bridges them — shared code lives there, app-specific code stays inside each app.
