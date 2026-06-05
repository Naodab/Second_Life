import { describe, expect, it } from "vitest";

import type { CartItemView } from "./cart-types";
import { calcBuyTotal, calcRentTotal, groupByDate, rentDays } from "./cart-utils";

function sampleItem(overrides: Partial<CartItemView> = {}): CartItemView {
  return {
    cartItemId: "cart-1",
    listingId: "listing-1",
    listingVariantId: "variant-1",
    name: "Test",
    images: [],
    facilityId: "f1",
    buyPrice: 100_000,
    rentPrice: 20_000,
    stock: 5,
    type: "buy",
    quantity: 1,
    addedAt: "2026-06-05T10:30:00",
    ...overrides,
  };
}

describe("cart-utils", () => {
  it("rentDays returns positive day difference", () => {
    expect(rentDays("2026-06-10", "2026-06-15")).toBe(5);
    expect(rentDays("2026-06-15", "2026-06-10")).toBe(0);
    expect(rentDays("", "2026-06-10")).toBe(0);
  });

  it("calcBuyTotal multiplies unit price by quantity", () => {
    expect(calcBuyTotal(sampleItem({ buyPrice: 50_000 }), 3)).toBe(150_000);
  });

  it("calcRentTotal uses rent days and quantity", () => {
    const item = sampleItem({ type: "rent", rentPrice: 10_000 });
    expect(calcRentTotal(item, "2026-06-01", "2026-06-04", 2)).toBe(60_000);
  });

  it("groupByDate groups items by added day", () => {
    const items = [
      sampleItem({ cartItemId: "a", addedAt: "2026-06-05T08:00:00" }),
      sampleItem({ cartItemId: "b", addedAt: "2026-06-05T20:00:00" }),
      sampleItem({ cartItemId: "c", addedAt: "2026-06-06T09:00:00" }),
    ];
    const grouped = groupByDate(items);
    expect(grouped.size).toBe(2);
    expect(grouped.get("2026-06-05")?.map((i) => i.cartItemId)).toEqual(["a", "b"]);
    expect(grouped.get("2026-06-06")?.map((i) => i.cartItemId)).toEqual(["c"]);
  });
});
