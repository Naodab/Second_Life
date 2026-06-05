import type { CartItemView } from "./cart-types";
import { format, differenceInDays, parseISO, startOfDay } from "date-fns";

export function groupByDate(items: CartItemView[]) {
  const map = new Map<string, CartItemView[]>();
  for (const item of items) {
    const key = format(startOfDay(parseISO(item.addedAt)), "yyyy-MM-dd");
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return map;
}

export function rentDays(start: string, end: string) {
  if (!start || !end) return 0;
  const d = differenceInDays(new Date(end), new Date(start));
  return d > 0 ? d : 0;
}

export function calcBuyTotal(item: CartItemView, qty: number) {
  return item.buyPrice * qty;
}

export function calcRentTotal(item: CartItemView, start: string, end: string, qty: number) {
  const days = rentDays(start, end);
  return days > 0 ? item.rentPrice * days * qty : 0;
}
