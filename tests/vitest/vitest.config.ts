// vitest.config.ts — entry point for `vitest run`.
//
// The actual project configuration (aliases, environments, include patterns)
// lives in vitest.workspace.ts. This file just tells Vitest to use it.
// Splitting them mirrors the pattern used by Playwright (playwright.config.ts
// is the entry; auth.setup.ts and test files are co-located separately).

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Hand off to the workspace file, which defines two projects:
    //   "store" → tests/store/** with "@" → apps/store/
    //   "admin" → tests/admin/** with "@" → apps/admin/
    workspace: "./vitest.workspace.ts",
  },
});
