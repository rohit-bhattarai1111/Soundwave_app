import { describe, it, expect } from "vitest";
import { isOnSale, getEffectivePriceInCents } from "@repo/db/pricing";

describe("isOnSale", () => {
  it("returns false when salePriceInCents is null", () => {
    expect(isOnSale({ priceInCents: 999, salePriceInCents: null })).toBe(false);
  });

  it("returns false when sale price equals list price", () => {
    expect(isOnSale({ priceInCents: 999, salePriceInCents: 999 })).toBe(false);
  });

  it("returns false when sale price exceeds list price", () => {
    expect(isOnSale({ priceInCents: 999, salePriceInCents: 1200 })).toBe(false);
  });

  it("returns true when sale price is below list price", () => {
    expect(isOnSale({ priceInCents: 999, salePriceInCents: 699 })).toBe(true);
  });
});

describe("getEffectivePriceInCents", () => {
  it("returns list price when not on sale", () => {
    expect(getEffectivePriceInCents({ priceInCents: 999, salePriceInCents: null })).toBe(999);
  });

  it("returns sale price when on sale", () => {
    expect(getEffectivePriceInCents({ priceInCents: 999, salePriceInCents: 699 })).toBe(699);
  });
});
