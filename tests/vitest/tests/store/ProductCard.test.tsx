// ProductCard.test.tsx — component tests for the ProductCard UI.
//
// WHAT WE'RE TESTING (component test):
//   Component tests render real React components in a fake DOM (jsdom) and
//   assert on what the USER would see: text, roles, labels.
//   We do NOT test implementation details (CSS class names, internal state).
//
// TESTING LIBRARY PHILOSOPHY — "test what users see":
//   React Testing Library intentionally forces you to query by role, label, or
//   visible text rather than internal selectors. This way your tests break when
//   the UI changes in a meaningful way, not when you rename a CSS class.
//
// MOCKING:
//   Two things need to be mocked here:
//
//   1. next/image — Next.js's <Image> component uses a layout engine that
//      doesn't exist in jsdom. Without a mock it throws errors.
//      We replace it with a plain <img> that still accepts the same props.
//
//   2. @/contexts/CartContext — ProductCard calls useCart() to get addItem().
//      Rather than spinning up a full CartProvider (which requires next-auth,
//      a real session, etc.) we mock the hook to return a dummy addItem.
//      This keeps the test focused on rendering, not on cart behaviour.

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/types";

// ── Mocks (vi.mock calls are hoisted before imports by Vitest's transform) ────

// Replace Next's Image with a simple <img> so jsdom doesn't error on layout.
vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => (
    <img alt={alt} src={src} />
  ),
}));

// Replace the entire CartContext module so useCart() returns a stub.
// addItem is a vi.fn() — we don't assert on it here, but it must exist so
// ProductCard doesn't throw "Cannot read properties of undefined".
vi.mock("@/contexts/CartContext", () => ({
  useCart: () => ({ addItem: vi.fn() }),
}));

// ── Test data ─────────────────────────────────────────────────────────────────

// A minimal product that satisfies the Product interface.
// 999 cents = $9.99, genre "ROCK" maps to display label "Rock".
const mockProduct: Product = {
  id: "1",
  title: "Neon Horizon",
  artist: "The Static Kings",
  genre: "ROCK",
  priceInCents: 999,
  salePriceInCents: null,
  imageUrl: "https://picsum.photos/seed/1/400/400",
  previewUrl: "/preview-placeholder.mp3",
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("ProductCard", () => {

  it("renders the album title as a heading", () => {
    render(<ProductCard product={mockProduct} />);
    // getByRole("heading") is semantically correct — it finds <h1>–<h6>.
    // This is preferred over getByText because it also verifies the element
    // IS a heading, not just text that happens to match.
    expect(screen.getByRole("heading", { name: "Neon Horizon" })).toBeInTheDocument();
  });

  it("renders the artist name", () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText("The Static Kings")).toBeInTheDocument();
  });

  it("formats priceInCents to a dollar string with 2 decimal places", () => {
    render(<ProductCard product={mockProduct} />);
    // 999 cents → (999 / 100).toFixed(2) → "9.99" → displayed as "$9.99"
    // If this fails it means the price conversion logic is broken.
    expect(screen.getByText("$9.99")).toBeInTheDocument();
  });

  it("renders the Add to Cart button", () => {
    render(<ProductCard product={mockProduct} />);
    // getByRole("button") is the correct semantic query for a <button> element.
    // We use a regex so the test is resilient to minor label wording changes.
    expect(screen.getByRole("button", { name: /add to cart/i })).toBeInTheDocument();
  });

  it("renders a different price correctly (1299 cents → $12.99)", () => {
    const expensiveProduct: Product = { ...mockProduct, priceInCents: 1299 };
    render(<ProductCard product={expensiveProduct} />);
    expect(screen.getByText("$12.99")).toBeInTheDocument();
  });

  it("shows sale badge, strikethrough list price, and sale price when on sale", () => {
    const saleProduct: Product = {
      ...mockProduct,
      priceInCents: 999,
      salePriceInCents: 699,
    };
    render(<ProductCard product={saleProduct} />);
    expect(screen.getByText("Sale")).toBeInTheDocument();
    expect(screen.getByText("$9.99")).toHaveClass("line-through");
    expect(screen.getByText("$6.99")).toBeInTheDocument();
  });

});
