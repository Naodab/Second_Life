import { format } from "date-fns";

import type { RentUnit } from "@/api/listing";

export type CartItemView = {
  cartItemId: string;
  listingId: string;
  listingVariantId: string;
  name: string;
  images: string[];
  facilityId: string;
  buyPrice: number;
  rentPrice: number;
  stock: number;
  type: "buy" | "rent";
  quantity: number;
  rentalDates?: { start: Date; end: Date };
  rentUnit?: RentUnit;
  addedAt: string;
};

export type ModeKey = `${string}:buy` | `${string}:rent`;

export interface ItemState {
  buyQty: number;
  rentQty: number;
  rentStart: string;
  rentEnd: string;
  buyStatus: "idle" | "checking" | "ok" | "error";
  buyMsg: string;
  rentStatus: "idle" | "checking" | "ok" | "error";
  rentMsg: string;
}

export function defaultState(item: CartItemView): ItemState {
  const rentStart = item.rentalDates?.start
    ? format(item.rentalDates.start, "yyyy-MM-dd")
    : "";
  const rentEnd = item.rentalDates?.end ? format(item.rentalDates.end, "yyyy-MM-dd") : "";

  return {
    buyQty: item.type === "buy" ? item.quantity || 1 : 1,
    rentQty: item.type === "rent" ? item.quantity || 1 : 1,
    rentStart,
    rentEnd,
    buyStatus: "idle",
    buyMsg: "",
    rentStatus: rentStart && rentEnd ? "ok" : "idle",
    rentMsg: "",
  };
}
