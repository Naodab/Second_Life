import type { CheckoutLineItem } from "@/checkout/build-checkout-line";
import { cn } from "@/lib/utils";
import { billableRentUnits, rentUnitLabelVu } from "@/pages/ListingDetail/rent-schedule-utils";

export { rentUnitLabelVu };

export const checkoutSectionClass = cn(
  "rounded-3xl border border-border/70 bg-card p-6 text-card-foreground shadow-sm",
  "ring-1 ring-border/40",
  "dark:border-border/50 dark:bg-card dark:shadow-2xl dark:shadow-black/25 dark:ring-border/30",
);

export const checkoutSectionShellClass = cn(
  "rounded-3xl border border-border/70 bg-card text-card-foreground shadow-sm overflow-hidden",
  "ring-1 ring-border/40",
  "dark:border-border/50 dark:bg-card dark:shadow-2xl dark:shadow-black/25 dark:ring-border/30",
);

export const checkoutHighlightClass = cn(
  "rounded-2xl border border-border/60 bg-muted/50 p-4",
  "dark:border-border/50 dark:bg-accent/50",
);

export const checkoutAlertClass = cn(
  "rounded-2xl border text-sm",
  "border-amber-200 bg-amber-50 text-amber-950",
  "dark:border-amber-500/35 dark:bg-amber-500/12 dark:text-amber-50",
);

export const checkoutDepositTextClass = cn(
  "text-amber-800 font-medium",
  "dark:text-amber-200",
);

export const checkoutRentAccentClass = cn(
  "text-secondary-foreground",
  "dark:text-[hsl(10,75%,88%)]",
);

export const checkoutPrimaryTextClass = cn(
  "text-primary",
  "dark:text-[hsl(152,55%,72%)]",
);

export function groupByFacility(items: CheckoutLineItem[]) {
  const map = new Map<string, CheckoutLineItem[]>();
  for (const item of items) {
    const key = item.facilityId || "__unknown";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return map;
}

export function itemDuration(item: CheckoutLineItem): number {
  if (item.mode !== "rent" || !item.rentalDates) return 0;
  return billableRentUnits(
    item.rentUnit ?? "DAY",
    item.rentalDates.start.getTime(),
    item.rentalDates.end.getTime(),
  );
}

export function itemTotal(item: CheckoutLineItem) {
  if (item.mode === "rent" && item.rentalDates) {
    return item.rentPrice * itemDuration(item) * item.quantity;
  }
  return item.unitPrice * item.quantity;
}

export function itemDays(item: CheckoutLineItem) {
  return itemDuration(item);
}

export function facilityDisplayName(item: CheckoutLineItem) {
  return item.facilityName?.trim() || item.facilityId || "Cơ sở";
}
