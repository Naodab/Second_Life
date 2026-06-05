import { describe, expect, it } from "vitest";

import type { CartItemResponse } from "@/api/cart";
import { mapCartApiToView } from "./cart-mapper";

describe("mapCartApiToView", () => {
  it("maps buy item with variant label", () => {
    const row: CartItemResponse = {
      id: "cart-1",
      listingId: "listing-1",
      listingVariantId: "variant-1",
      quantity: 2,
      mode: "BUY",
      title: "Áo khoác",
      variantLabel: "Size M",
      thumbnailUrl: "https://cdn.example/a.jpg",
      facilityId: "facility-1",
      buyPrice: 120_000,
      rentPrice: 0,
      addedAt: "2026-06-05T10:00:00",
    };

    const view = mapCartApiToView(row);

    expect(view.cartItemId).toBe("cart-1");
    expect(view.name).toBe("Áo khoác (Size M)");
    expect(view.type).toBe("buy");
    expect(view.images).toEqual(["https://cdn.example/a.jpg"]);
    expect(view.buyPrice).toBe(120_000);
    expect(view.quantity).toBe(2);
    expect(view.rentalDates).toBeUndefined();
  });

  it("maps rent item with rental dates", () => {
    const row: CartItemResponse = {
      id: "cart-2",
      listingId: "listing-2",
      listingVariantId: "variant-2",
      quantity: 1,
      mode: "RENT",
      title: "Máy ảnh",
      rentPrice: 50_000,
      rentalStart: "2026-06-10T08:00:00",
      rentalEnd: "2026-06-15T18:00:00",
      rentUnit: "DAY",
      addedAt: "2026-06-05T11:00:00",
    };

    const view = mapCartApiToView(row);

    expect(view.type).toBe("rent");
    expect(view.rentPrice).toBe(50_000);
    expect(view.rentUnit).toBe("DAY");
    expect(view.rentalDates?.start).toEqual(new Date("2026-06-10T08:00:00"));
    expect(view.rentalDates?.end).toEqual(new Date("2026-06-15T18:00:00"));
  });
});
