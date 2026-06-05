import { describe, expect, it } from "vitest";

import {
  buildBuyCartPayload,
  buildBuyCheckoutLine,
  buildRentCartPayload,
  buildRentCheckoutLine,
  canProceedBuy,
  canProceedRent,
  shouldOpenRentModalForQuickAdd,
  type BuyActionContext,
  type RentActionContext,
} from "./listing-detail-actions";

const buyCtx: BuyActionContext = {
  listingId: "listing-1",
  listingVariantId: "variant-1",
  quantity: 2,
  effectiveBuyStock: 5,
  dialogBuyUnitPrice: 120_000,
};

const rentWindow = {
  startMs: new Date("2026-06-10T08:00:00").getTime(),
  endExclusiveMs: new Date("2026-06-15T18:00:00").getTime(),
};

const rentCtx: RentActionContext = {
  listingId: "listing-2",
  listingVariantId: "variant-2",
  quantity: 1,
  dialogRentUnitPrice: 50_000,
  rentWindow,
  rentValidityOk: true,
  rentRangeBlocked: false,
  rentUnit: "DAY",
};

describe("listing-detail buy actions", () => {
  it("canProceedBuy requires variant, stock and price", () => {
    expect(canProceedBuy(buyCtx)).toBe(true);
    expect(canProceedBuy({ ...buyCtx, listingVariantId: null })).toBe(false);
    expect(canProceedBuy({ ...buyCtx, effectiveBuyStock: 0 })).toBe(false);
    expect(canProceedBuy({ ...buyCtx, dialogBuyUnitPrice: 0 })).toBe(false);
  });

  it("buildBuyCheckoutLine returns checkout line for Mua ngay", () => {
    expect(buildBuyCheckoutLine(buyCtx)).toEqual({
      listingId: "listing-1",
      listingVariantId: "variant-1",
      quantity: 2,
      mode: "buy",
    });
  });

  it("buildBuyCheckoutLine returns null when blocked", () => {
    expect(buildBuyCheckoutLine({ ...buyCtx, effectiveBuyStock: 0 })).toBeNull();
  });

  it("buildBuyCartPayload returns API payload for Thêm vào giỏ", () => {
    expect(buildBuyCartPayload({ ...buyCtx, quantity: 1 })).toEqual({
      listingId: "listing-1",
      listingVariantId: "variant-1",
      quantity: 1,
      mode: "BUY",
    });
  });
});

describe("listing-detail rent actions", () => {
  it("canProceedRent requires window, validity and no range block", () => {
    expect(canProceedRent(rentCtx)).toBe(true);
    expect(canProceedRent({ ...rentCtx, rentWindow: null })).toBe(false);
    expect(canProceedRent({ ...rentCtx, rentValidityOk: false })).toBe(false);
    expect(canProceedRent({ ...rentCtx, rentRangeBlocked: true })).toBe(false);
    expect(canProceedRent({ ...rentCtx, dialogRentUnitPrice: 0 })).toBe(false);
  });

  it("buildRentCheckoutLine returns checkout line for Thuê ngay", () => {
    const line = buildRentCheckoutLine(rentCtx);
    expect(line).toMatchObject({
      listingId: "listing-2",
      listingVariantId: "variant-2",
      quantity: 1,
      mode: "rent",
      rentUnit: "DAY",
    });
    expect(line?.rentalStart).toBe(new Date(rentWindow.startMs).toISOString());
    expect(line?.rentalEnd).toBe(new Date(rentWindow.endExclusiveMs).toISOString());
  });

  it("buildRentCartPayload uses API datetime format", () => {
    expect(buildRentCartPayload(rentCtx)).toEqual({
      listingId: "listing-2",
      listingVariantId: "variant-2",
      quantity: 1,
      mode: "RENT",
      rentalStart: "2026-06-10T08:00:00",
      rentalEnd: "2026-06-15T18:00:00",
      rentUnit: "DAY",
    });
  });

  it("buildRentCheckoutLine returns null when rent range blocked", () => {
    expect(buildRentCheckoutLine({ ...rentCtx, rentRangeBlocked: true })).toBeNull();
  });
});

describe("quick add to cart", () => {
  it("opens rent modal for RENT listings", () => {
    expect(shouldOpenRentModalForQuickAdd("RENT")).toBe(true);
    expect(shouldOpenRentModalForQuickAdd("BUY")).toBe(false);
  });
});
