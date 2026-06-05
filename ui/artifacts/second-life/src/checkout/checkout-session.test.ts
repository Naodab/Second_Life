import { beforeEach, describe, expect, it } from "vitest";

import {
  buildCheckoutCartHref,
  buildCheckoutHref,
  clearPendingCheckoutLine,
  getPendingCheckoutLine,
  getPendingCheckoutLines,
  isCartCheckoutSearch,
  parseCheckoutSearch,
  resolveCheckoutInputs,
  setPendingCheckoutLine,
  setPendingCheckoutLines,
  type CheckoutLineInput,
} from "./checkout-session";

const buyLine: CheckoutLineInput = {
  listingId: "listing-1",
  listingVariantId: "variant-1",
  quantity: 2,
  mode: "buy",
};

const rentLine: CheckoutLineInput = {
  listingId: "listing-2",
  listingVariantId: "variant-2",
  quantity: 1,
  mode: "rent",
  rentalStart: "2026-06-10T08:00:00",
  rentalEnd: "2026-06-15T18:00:00",
  rentUnit: "DAY",
  cartItemId: "cart-rent-1",
};

beforeEach(() => {
  clearPendingCheckoutLine();
});

describe("checkout-session", () => {
  it("setPendingCheckoutLine stores a single line", () => {
    setPendingCheckoutLine(buyLine);
    expect(getPendingCheckoutLine()).toEqual(buyLine);
    expect(getPendingCheckoutLines()).toEqual([buyLine]);
  });

  it("setPendingCheckoutLines stores multiple lines and clears single pending when >1", () => {
    setPendingCheckoutLines([buyLine, rentLine]);
    expect(getPendingCheckoutLines()).toEqual([buyLine, rentLine]);
    expect(getPendingCheckoutLine()).toBeNull();
  });

  it("setPendingCheckoutLines with one line keeps pending single line", () => {
    setPendingCheckoutLines([rentLine]);
    expect(getPendingCheckoutLine()).toEqual(rentLine);
  });

  it("clearPendingCheckoutLine resets session", () => {
    setPendingCheckoutLines([buyLine, rentLine]);
    clearPendingCheckoutLine();
    expect(getPendingCheckoutLines()).toEqual([]);
    expect(getPendingCheckoutLine()).toBeNull();
  });

  it("parseCheckoutSearch parses buy query", () => {
    const search =
      "?listingId=listing-1&listingVariantId=variant-1&quantity=3&mode=buy";
    expect(parseCheckoutSearch(search)).toEqual({
      listingId: "listing-1",
      listingVariantId: "variant-1",
      quantity: 3,
      mode: "buy",
    });
  });

  it("parseCheckoutSearch parses rent query with dates", () => {
    const search =
      "?listingId=l1&listingVariantId=v1&quantity=1&mode=rent&rentalStart=2026-06-10T08:00:00&rentalEnd=2026-06-15T18:00:00&rentUnit=DAY";
    expect(parseCheckoutSearch(search)).toEqual({
      listingId: "l1",
      listingVariantId: "v1",
      quantity: 1,
      mode: "rent",
      rentalStart: "2026-06-10T08:00:00",
      rentalEnd: "2026-06-15T18:00:00",
      rentUnit: "DAY",
    });
  });

  it("parseCheckoutSearch returns null for cart checkout marker", () => {
    expect(parseCheckoutSearch("?from=cart")).toBeNull();
  });

  it("isCartCheckoutSearch detects cart flow", () => {
    expect(isCartCheckoutSearch("?from=cart")).toBe(true);
    expect(isCartCheckoutSearch("?listingId=a&listingVariantId=b&quantity=1&mode=buy")).toBe(false);
  });

  it("resolveCheckoutInputs prefers cart session when from=cart", () => {
    setPendingCheckoutLines([buyLine, rentLine]);
    expect(resolveCheckoutInputs("?from=cart")).toEqual([buyLine, rentLine]);
  });

  it("resolveCheckoutInputs prefers URL over pending session", () => {
    setPendingCheckoutLines([rentLine]);
    const search = "?listingId=listing-1&listingVariantId=variant-1&quantity=2&mode=buy";
    expect(resolveCheckoutInputs(search)).toEqual([
      {
        listingId: "listing-1",
        listingVariantId: "variant-1",
        quantity: 2,
        mode: "buy",
      },
    ]);
  });

  it("resolveCheckoutInputs falls back to pending lines", () => {
    setPendingCheckoutLines([buyLine, rentLine]);
    expect(resolveCheckoutInputs("")).toEqual([buyLine, rentLine]);
  });

  it("buildCheckoutHref round-trips buy line", () => {
    const href = buildCheckoutHref(buyLine);
    expect(href.startsWith("/checkout?")).toBe(true);
    expect(parseCheckoutSearch(href.replace("/checkout", ""))).toEqual(buyLine);
  });

  it("buildCheckoutCartHref returns cart marker", () => {
    expect(buildCheckoutCartHref()).toBe("/checkout?from=cart");
  });
});
