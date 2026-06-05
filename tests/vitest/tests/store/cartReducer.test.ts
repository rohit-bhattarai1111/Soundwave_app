// cartReducer.test.ts — pure unit tests for the cart reducer function.
//
// UNIT TEST vs COMPONENT TEST vs E2E:
//   Unit test    → tests a single function in isolation. No DOM, no HTTP.
//                  Pure input → output. Fastest, most focused.
//   Component    → mounts a React component in jsdom and interacts with it.
//                  Slower than unit but tests integration of state + UI.
//   E2E (Playwright) → launches a real browser against the running app.
//                  Tests the full stack: DB, API, UI together. Slowest.
//
// cartReducer is a PURE FUNCTION (same input always gives same output,
// no side effects). Pure functions are ideal for unit testing — no setup
// or teardown needed. We just call the function and check the return value.
//
// WHY MOCK next-auth/react HERE?
//   We're only importing `cartReducer` (a pure function), but it lives in
//   CartContext.tsx which also imports useSession from next-auth/react.
//   When Vitest loads CartContext.tsx, it runs the file's top-level imports.
//   Without a mock, next-auth/react might try to access browser APIs not
//   present in the test environment and throw. The mock prevents that by
//   replacing the real module before CartContext.tsx is loaded.

import { describe, it, expect, vi } from "vitest";

// vi.mock is hoisted before the import below by Vitest's transform.
// So when CartContext.tsx is loaded, next-auth/react is already mocked.
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({ data: null, status: "unauthenticated" })),
}));

import { cartReducer } from "@/contexts/CartContext";
import type { CartState } from "@/contexts/CartContext";

// ── Test data ─────────────────────────────────────────────────────────────────

const EMPTY: CartState = { items: [], hydrated: false };

const ITEM_A = { id: "1", title: "Neon Horizon",   artist: "The Static Kings",  price: 9.99 };
const ITEM_B = { id: "2", title: "Midnight Smoke", artist: "Ella Voss Quartet", price: 11.99 };

// ── ADD_ITEM ──────────────────────────────────────────────────────────────────

describe("cartReducer — ADD_ITEM", () => {

  it("pushes a new item with quantity 1 when the cart is empty", () => {
    const next = cartReducer(EMPTY, { type: "ADD_ITEM", payload: ITEM_A });

    expect(next.items).toHaveLength(1);
    // toMatchObject checks a subset of properties — we don't care about
    // other fields as long as these values are correct.
    expect(next.items[0]).toMatchObject({ ...ITEM_A, quantity: 1 });
  });

  it("increments quantity when the same item is added again", () => {
    // State already has one copy of ITEM_A.
    const withOne: CartState = {
      items: [{ ...ITEM_A, quantity: 1 }],
      hydrated: true,
    };

    const next = cartReducer(withOne, { type: "ADD_ITEM", payload: ITEM_A });

    // Still one row — quantity goes from 1 to 2. No duplicate entry created.
    expect(next.items).toHaveLength(1);
    expect(next.items[0]!.quantity).toBe(2);
  });

  it("adds a second distinct item without touching the first", () => {
    const withA: CartState = { items: [{ ...ITEM_A, quantity: 1 }], hydrated: true };

    const next = cartReducer(withA, { type: "ADD_ITEM", payload: ITEM_B });

    expect(next.items).toHaveLength(2);
    // The original item is untouched.
    expect(next.items[0]!.id).toBe("1");
    // The new item was added with quantity 1.
    expect(next.items[1]!).toMatchObject({ ...ITEM_B, quantity: 1 });
  });

});

// ── REMOVE_ITEM ───────────────────────────────────────────────────────────────

describe("cartReducer — REMOVE_ITEM", () => {

  it("removes only the item with the matching id", () => {
    const state: CartState = {
      items: [
        { ...ITEM_A, quantity: 1 },
        { ...ITEM_B, quantity: 2 },
      ],
      hydrated: true,
    };

    const next = cartReducer(state, { type: "REMOVE_ITEM", payload: { id: "1" } });

    // ITEM_A (id "1") is gone; ITEM_B (id "2") remains.
    expect(next.items).toHaveLength(1);
    expect(next.items[0]!.id).toBe("2");
  });

  it("returns state unchanged when the id does not exist in the cart", () => {
    const state: CartState = {
      items: [{ ...ITEM_A, quantity: 1 }],
      hydrated: true,
    };

    const next = cartReducer(state, { type: "REMOVE_ITEM", payload: { id: "999" } });

    // Filtering a non-existent id is a no-op.
    expect(next.items).toHaveLength(1);
    expect(next.items[0]!.id).toBe("1");
  });

});
