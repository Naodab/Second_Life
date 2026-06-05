import type { CartItemAddPayload } from "@/api/cart";
import type { RentUnit } from "@/api/listing";
import type { CheckoutLineInput } from "@/checkout/checkout-session";
import { toApiDateTime } from "@/cart/cart-datetime";

import type { RentScheduleWindow } from "./ListingRentScheduler";

export type BuyActionContext = {
  listingId: string;
  listingVariantId: string | null;
  quantity: number;
  effectiveBuyStock: number;
  dialogBuyUnitPrice: number;
};

export function canProceedBuy(ctx: BuyActionContext): boolean {
  return Boolean(ctx.listingVariantId) && ctx.effectiveBuyStock > 0 && ctx.dialogBuyUnitPrice > 0;
}

export function buildBuyCheckoutLine(ctx: BuyActionContext): CheckoutLineInput | null {
  if (!canProceedBuy(ctx) || !ctx.listingVariantId) return null;
  return {
    listingId: ctx.listingId,
    listingVariantId: ctx.listingVariantId,
    quantity: ctx.quantity,
    mode: "buy",
  };
}

export function buildBuyCartPayload(ctx: BuyActionContext): CartItemAddPayload | null {
  if (!canProceedBuy(ctx) || !ctx.listingVariantId) return null;
  return {
    listingId: ctx.listingId,
    listingVariantId: ctx.listingVariantId,
    quantity: ctx.quantity,
    mode: "BUY",
  };
}

export type RentActionContext = {
  listingId: string;
  listingVariantId: string | null;
  quantity: number;
  dialogRentUnitPrice: number;
  rentWindow: RentScheduleWindow | null;
  rentValidityOk: boolean;
  rentRangeBlocked: boolean;
  rentUnit: RentUnit;
};

export function canProceedRent(ctx: RentActionContext): boolean {
  return (
    Boolean(ctx.listingVariantId) &&
    ctx.dialogRentUnitPrice > 0 &&
    Boolean(ctx.rentWindow) &&
    ctx.rentValidityOk &&
    !ctx.rentRangeBlocked
  );
}

export function buildRentCheckoutLine(ctx: RentActionContext): CheckoutLineInput | null {
  if (!canProceedRent(ctx) || !ctx.listingVariantId || !ctx.rentWindow) return null;
  return {
    listingId: ctx.listingId,
    listingVariantId: ctx.listingVariantId,
    quantity: ctx.quantity,
    mode: "rent",
    rentalStart: new Date(ctx.rentWindow.startMs).toISOString(),
    rentalEnd: new Date(ctx.rentWindow.endExclusiveMs).toISOString(),
    rentUnit: ctx.rentUnit,
  };
}

export function buildRentCartPayload(ctx: RentActionContext): CartItemAddPayload | null {
  if (!canProceedRent(ctx) || !ctx.listingVariantId || !ctx.rentWindow) return null;
  return {
    listingId: ctx.listingId,
    listingVariantId: ctx.listingVariantId,
    quantity: ctx.quantity,
    mode: "RENT",
    rentalStart: toApiDateTime(new Date(ctx.rentWindow.startMs)),
    rentalEnd: toApiDateTime(new Date(ctx.rentWindow.endExclusiveMs)),
    rentUnit: ctx.rentUnit,
  };
}

export function shouldOpenRentModalForQuickAdd(listingType: string): boolean {
  return listingType === "RENT";
}
