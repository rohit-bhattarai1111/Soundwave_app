import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MONOREPO_ROOT = path.resolve(__dirname, "../..");

const TEST_DB_PATH = path.join(MONOREPO_ROOT, "packages", "db", "prisma", "test.db");

const TEST_DATABASE_URL = `file:${TEST_DB_PATH.replace(/\\/g, "/")}`;

const USER_AUTH  = ".auth/user.json";
const ADMIN_AUTH = ".auth/admin.json";

export default defineConfig({
  globalSetup: "./global-setup.ts",

  testDir: "./tests",

  reporter: [["list"], ["html", { open: "never" }]],

  workers: 1,

  use: {
    baseURL: "http://localhost:3002",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "setup",
      testMatch: "**/auth.setup.ts",
      use: { ...devices["Desktop Chrome"] },
    },

    {
      name:    "web",
      testDir: "./tests/web",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://localhost:3002",
      },
      dependencies: ["setup"],
    },

    {
      name:    "admin",
      testDir: "./tests/admin",
      use: {
        ...devices["Desktop Chrome"],
        baseURL:      "http://localhost:3003",
        storageState: ADMIN_AUTH,
      },
      dependencies: ["setup"],
    },
  ],

  webServer: [
    {
      command: "pnpm --filter store start:e2e",
      url:     "http://localhost:3002",
      env: {
        DATABASE_URL:     TEST_DATABASE_URL,
        AUTH_URL:         "http://localhost:3002",
        AUTH_TRUST_HOST:  "true",
        AUTH_SECRET:      "e2e-test-secret-soundwave-32chars",
        AUTH_COOKIE_NAME: "store.session-token",
      },
      reuseExistingServer: true,
    },

    {
      command: "pnpm --filter admin start:e2e",
      url:     "http://localhost:3003",
      env: {
        DATABASE_URL:     TEST_DATABASE_URL,
        AUTH_URL:         "http://localhost:3003",
        AUTH_TRUST_HOST:  "true",
        AUTH_SECRET:      "e2e-test-secret-soundwave-32chars",
        AUTH_COOKIE_NAME: "admin.session-token",
      },
      reuseExistingServer: true,
    },
  ],
});
