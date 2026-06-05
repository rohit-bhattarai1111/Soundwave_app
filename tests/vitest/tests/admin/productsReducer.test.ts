// productsReducer.test.ts — pure unit tests for the admin products reducer.
//
// productsReducer handles three actions:
//   ADD_PRODUCT    → appends a new product to the list
//   UPDATE_PRODUCT → replaces the product with a matching id
//   DELETE_PRODUCT → removes the product with a matching id
//
// Like cartReducer, this is a pure function with no side effects —
// perfect for unit testing without any mocking, setup, or teardown.

import { describe, it, expect } from "vitest";
import { productsReducer } from "@/contexts/ProductsContext";
import type { Product, Genre } from "@/lib/mock-data";

// ── Test data ─────────────────────────────────────────────────────────────────

function makeProduct(id: string, title: string): Product {
  return {
    id,
    title,
    artist: "Test Artist",
    genre:  "Rock" as Genre,
    price:  9.99,
    stock:  10,
    imageUrl:   "",
    previewUrl: "",
  };
}

const PRODUCT_A = makeProduct("1", "Neon Horizon");
const PRODUCT_B = makeProduct("2", "Midnight Smoke");

// ── ADD_PRODUCT ───────────────────────────────────────────────────────────────

describe("productsReducer — ADD_PRODUCT", () => {

  it("appends the new product to the end of the list", () => {
    const state   = { products: [PRODUCT_A] };
    const next    = productsReducer(state, { type: "ADD_PRODUCT", payload: PRODUCT_B });

    expect(next.products).toHaveLength(2);
    expect(next.products[1]!.id).toBe("2");
    expect(next.products[1]!.title).toBe("Midnight Smoke");
  });

  it("works when the list is empty", () => {
    const state = { products: [] };
    const next  = productsReducer(state, { type: "ADD_PRODUCT", payload: PRODUCT_A });

    expect(next.products).toHaveLength(1);
    expect(next.products[0]!.id).toBe("1");
  });

});

// ── UPDATE_PRODUCT ────────────────────────────────────────────────────────────

describe("productsReducer — UPDATE_PRODUCT", () => {

  it("replaces the product whose id matches", () => {
    const state   = { products: [PRODUCT_A, PRODUCT_B] };
    const updated = { ...PRODUCT_A, title: "Updated Horizon" };

    const next = productsReducer(state, { type: "UPDATE_PRODUCT", payload: updated });

    expect(next.products).toHaveLength(2);
    expect(next.products[0]!.title).toBe("Updated Horizon");
  });

  it("does not modify other products in the list", () => {
    const state   = { products: [PRODUCT_A, PRODUCT_B] };
    const updated = { ...PRODUCT_A, title: "Updated" };

    const next = productsReducer(state, { type: "UPDATE_PRODUCT", payload: updated });

    // PRODUCT_B should be identical to the original.
    expect(next.products[1]!.title).toBe("Midnight Smoke");
    expect(next.products[1]!.id).toBe("2");
  });

});

// ── DELETE_PRODUCT ────────────────────────────────────────────────────────────

describe("productsReducer — DELETE_PRODUCT", () => {

  it("removes the product with the matching id", () => {
    const state = { products: [PRODUCT_A, PRODUCT_B] };

    const next = productsReducer(state, { type: "DELETE_PRODUCT", payload: { id: "1" } });

    expect(next.products).toHaveLength(1);
    expect(next.products[0]!.id).toBe("2");
  });

  it("returns an empty list when the last product is deleted", () => {
    const state = { products: [PRODUCT_A] };

    const next = productsReducer(state, { type: "DELETE_PRODUCT", payload: { id: "1" } });

    expect(next.products).toHaveLength(0);
  });

  it("returns state unchanged when id does not exist", () => {
    const state = { products: [PRODUCT_A, PRODUCT_B] };

    const next = productsReducer(state, { type: "DELETE_PRODUCT", payload: { id: "999" } });

    expect(next.products).toHaveLength(2);
  });

});
