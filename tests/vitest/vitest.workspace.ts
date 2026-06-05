// vitest.workspace.ts — workspace definition for the @soundwave/tests-vitest package.
//
// WHY A WORKSPACE FILE?
//   Vitest's "workspace" feature lets one test command cover multiple projects,
//   each with its own config. This is essential here because both apps use the
//   same "@/" path alias, but it points to a DIFFERENT root directory:
//
//     apps/store  → "@/" means apps/store/
//     apps/admin  → "@/" means apps/admin/
//
//   A single vitest.config.ts can only define one alias for "@/". The workspace
//   file defines TWO projects, each with the correct alias for its app.
//
// DISCOVERY:
//   When `vitest run` is called, Vitest looks for `vitest.workspace.ts` in the
//   current directory alongside (or instead of) vitest.config.ts.
//   No other configuration is needed to activate the workspace.

import { defineWorkspace } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ESM equivalent of __dirname.
const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineWorkspace([

  // ── Store project ──────────────────────────────────────────────────────────
  {
    // @vitejs/plugin-react transforms JSX in test files (and imported components).
    plugins: [react()],
    test: {
      name: "store",
      // Only pick up tests inside tests/store/.
      include: ["tests/store/**/*.test.{ts,tsx}"],
      // jsdom provides document, window, etc. — required by React Testing Library.
      environment: "jsdom",
      // vitest.setup.ts imports @testing-library/jest-dom to extend expect().
      setupFiles: [resolve(__dirname, "vitest.setup.ts")],
      // globals: true makes expect/describe/it etc. available WITHOUT importing
      // them. More importantly, it makes `expect` available in the setup file
      // so @testing-library/jest-dom can call expect.extend(matchers).
      globals: true,
    },
    resolve: {
      alias: {
        // "@/" in store component source maps to apps/store/ at import time.
        // e.g.  "@/contexts/CartContext" → apps/store/contexts/CartContext.tsx
        "@": resolve(__dirname, "../../apps/store"),
      },
    },
  },

  // ── Admin project ──────────────────────────────────────────────────────────
  {
    plugins: [react()],
    test: {
      name: "admin",
      include: ["tests/admin/**/*.test.{ts,tsx}"],
      environment: "jsdom",
      setupFiles: [resolve(__dirname, "vitest.setup.ts")],
      globals: true,
    },
    resolve: {
      alias: {
        // "@/" in admin component source maps to apps/admin/ at import time.
        "@": resolve(__dirname, "../../apps/admin"),
      },
    },
  },

]);
