// auth.spec.ts — E2E tests for all authentication flows in the store.
//
// COVERAGE:
//   Registration:    new user, password mismatch, short password, duplicate email
//   Login:           valid creds, wrong password, invalid email format
//   Route protection: /cart, /orders, /checkout redirect to /login when unauthenticated
//   Logout:          logged-in user can sign out and returns to guest state
//
// WHY E2E FOR AUTH?
//   Unit tests can't catch the full chain: form → API → DB write → NextAuth signIn
//   → session cookie → redirect. Only a browser-based test covers all of it.

import { test, expect }             from "@playwright/test";
import path                          from "node:path";
import { fileURLToPath }             from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Path to the saved user session (created by auth.setup.ts).
const USER_AUTH  = path.join(__dirname, "../../.auth/user.json");

// ── Default context: no session ───────────────────────────────────────────────
// All describe blocks below run unauthenticated unless they override with
// test.use({ storageState: USER_AUTH }) inside their own describe block.
test.use({ storageState: { cookies: [], origins: [] } });

// ─────────────────────────────────────────────────────────────────────────────
// Registration
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Registration", () => {

  test("registers a new user and sees the product grid", async ({ page }) => {
    // Navigate to the registration page.
    await page.goto("/register");

    // Combine timestamp + random suffix so the email is unique across repeated runs
    // and even if two test workers start within the same millisecond.
    const uniqueEmail = `e2e_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@test.com`;

    // Fill out the registration form.
    await page.getByLabel("Full name").fill("E2E Test User");
    await page.getByLabel("Email address").fill(uniqueEmail);
    // exact: true distinguishes "Password" from "Confirm password".
    await page.getByLabel("Password", { exact: true }).fill("e2epassword123");
    await page.getByLabel("Confirm password").fill("e2epassword123");

    // Submit the form.
    await page.getByRole("button", { name: "Create account" }).click();

    // A successful registration auto-signs-in and redirects to "/".
    await page.waitForURL("/");

    // The product grid (server-rendered <article> cards) should be visible.
    await expect(page.getByRole("article").first()).toBeVisible();
  });

  test("shows 'Passwords do not match.' when confirmation differs", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Full name").fill("Test User");
    await page.getByLabel("Email address").fill("anyone@example.com");
    await page.getByLabel("Password", { exact: true }).fill("password123");
    // Deliberately different value:
    await page.getByLabel("Confirm password").fill("different456");
    await page.getByRole("button", { name: "Create account" }).click();

    // Client-side validation fires before any network call.
    await expect(page.getByText("Passwords do not match.")).toBeVisible();
    // URL must NOT have changed — user stays on /register.
    await expect(page).toHaveURL(/\/register/);
  });

  test("shows validation error for a password shorter than 6 characters", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("Full name").fill("Test User");
    await page.getByLabel("Email address").fill("anyone@example.com");
    await page.getByLabel("Password", { exact: true }).fill("abc");
    await page.getByLabel("Confirm password").fill("abc");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText("Password must be at least 6 characters.")).toBeVisible();
  });

  test("shows an email error when registering with an already-registered email", async ({ page }) => {
    await page.goto("/register");
    // user@test.com is seeded by seed-e2e.ts — always exists in the test DB.
    await page.getByLabel("Full name").fill("Duplicate User");
    await page.getByLabel("Email address").fill("user@test.com");
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByLabel("Confirm password").fill("password123");
    await page.getByRole("button", { name: "Create account" }).click();

    // The API returns 409 Conflict → the register page renders the error on the email field.
    // The message contains "already" (from "An account with this email address already exists.").
    await expect(page.getByText(/already/i)).toBeVisible({ timeout: 8_000 });
    await expect(page).toHaveURL(/\/register/);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Login", () => {

  test("valid credentials redirect to home and show the Logout button", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email address").fill("user@test.com");
    await page.getByLabel("Password").fill("user123");
    await page.getByRole("button", { name: "Log in" }).click();

    // Successful login redirects to "/".
    await page.waitForURL("/");

    // NavbarAuthSection renders a "Logout" button once useSession() resolves as authenticated.
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible({ timeout: 10_000 });
  });

  test("wrong password shows 'Invalid email or password.' error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email address").fill("user@test.com");
    await page.getByLabel("Password").fill("this-is-wrong");
    await page.getByRole("button", { name: "Log in" }).click();

    // NextAuth returns CredentialsSignin error → the login page shows a vague message
    // (intentionally vague — don't reveal which field was wrong to an attacker).
    await expect(page.getByText("Invalid email or password.")).toBeVisible({ timeout: 8_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("invalid email format shows client-side validation error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email address").fill("notanemail");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Log in" }).click();

    // The regex check fires before the network call — error appears immediately.
    await expect(page.getByText("Please enter a valid email address.")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// Route protection — middleware redirects unauthenticated users to /login
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Route protection", () => {

  test("visiting /cart without a session redirects to /login", async ({ page }) => {
    // middleware.ts has matcher: ["/cart/:path*", "/checkout/:path*", "/orders/:path*"]
    // Unauthenticated requests to these paths are redirected by NextAuth middleware.
    await page.goto("/cart");
    await expect(page).toHaveURL(/\/login/);
  });

  test("visiting /orders without a session redirects to /login", async ({ page }) => {
    await page.goto("/orders");
    await expect(page).toHaveURL(/\/login/);
  });

  test("visiting /checkout without a session redirects to /login", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/login/);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// Logout — requires an authenticated session
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Logout", () => {
  // Override the file-level storageState so this describe block starts logged in.
  test.use({ storageState: USER_AUTH });

  test("a logged-in user can log out and sees the Login button", async ({ page }) => {
    await page.goto("/");

    // Wait for useSession() to resolve — Logout button is the signal.
    await page.getByRole("button", { name: "Logout" }).waitFor({ timeout: 10_000 });

    // signOut({ callbackUrl: "/" }) POSTs to /api/auth/signout, then reloads "/".
    // waitForURL("/") resolves instantly (already at "/"), so use waitForLoadState
    // to ensure the full page reload triggered by signOut completes before asserting.
    await page.getByRole("button", { name: "Logout" }).click();
    await page.waitForLoadState("networkidle");

    // After sign-out, NavbarAuthSection renders the guest state (Register + Login links).
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible({ timeout: 10_000 });
  });

});
