// route.ts — NextAuth.js v5 catch-all route handler for the admin app.
//
// Same pattern as apps/store: mount the shared handlers at /api/auth/[...nextauth].
// The handlers are defined once in packages/auth/src/index.ts — no auth logic here.

import { handlers } from "@repo/auth";

export const { GET, POST } = handlers;
