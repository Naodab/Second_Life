import type { CheckoutSelection } from "@/hooks/use-mock-api";
import { differenceInDays } from "date-fns";

export function groupByShop(items: CheckoutSelection[]) {
  const map = new Map<string, CheckoutSelection[]>();
  for (const item of items) {
    if (!map.has(item.shopId)) map.set(item.shopId, []);
    map.get(item.shopId)!.push(item);
  }
  return map;
}

export function itemTotal(item: CheckoutSelection) {
  if (item.mode === "rent" && item.rentalDates) {
    const days = Math.max(1, differenceInDays(item.rentalDates.end, item.rentalDates.start));
    return item.rentPrice * days * item.quantity;
  }
  return item.buyPrice * item.quantity;
}

export function itemDays(item: CheckoutSelection) {
  if (item.mode !== "rent" || !item.rentalDates) return 0;
  return Math.max(1, differenceInDays(item.rentalDates.end, item.rentalDates.start));
}
