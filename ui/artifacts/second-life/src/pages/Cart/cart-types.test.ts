import { describe, expect, it } from "vitest";

import { defaultState, type CartItemView } from "./cart-types";

describe("defaultState", () => {
  it("initializes buy quantities from cart item", () => {
    const item: CartItemView = {
      cartItemId: "c1",
      listingId: "l1",
      listingVariantId: "v1",
      name: "Buy item",
      images: [],
      facilityId: "f1",
      buyPrice: 100_000,
      rentPrice: 0,
      stock: 3,
      type: "buy",
      quantity: 2,
      addedAt: "2026-06-05T10:00:00",
    };

    const state = defaultState(item);
    expect(state.buyQty).toBe(2);
    expect(state.rentQty).toBe(1);
    expect(state.rentStart).toBe("");
    expect(state.rentStatus).toBe("idle");
  });

  it("prefills rent dates from cart rentalDates", () => {
    const item: CartItemView = {
      cartItemId: "c2",
      listingId: "l2",
      listingVariantId: "v2",
      name: "Rent item",
      images: [],
      facilityId: "f2",
      buyPrice: 0,
      rentPrice: 30_000,
      stock: 1,
      type: "rent",
      quantity: 1,
      rentalDates: {
        start: new Date("2026-06-10T08:00:00"),
        end: new Date("2026-06-15T18:00:00"),
      },
      addedAt: "2026-06-05T10:00:00",
    };

    const state = defaultState(item);
    expect(state.rentQty).toBe(1);
    expect(state.rentStart).toBe("2026-06-10");
    expect(state.rentEnd).toBe("2026-06-15");
    expect(state.rentStatus).toBe("ok");
  });
});
