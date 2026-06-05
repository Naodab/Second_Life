import type { BookingOrderResponse } from "@/api/booking";
import type { RentalOrderResponse, RentalOrderStatus } from "@/api/rental";
import type { ListingVariantContextResponse } from "@/api/listing";

export type OrderKind = "buy" | "rent";

export type OrderDisplayStatus = BookingOrderResponse["status"] | RentalOrderStatus;

export type EnrichedOrder = {
  id: string;
  kind: OrderKind;
  listingVariantId: string;
  customerId: string;
  customer?: BookingOrderResponse["customer"];
  price?: number | null;
  quantity: number;
  status: OrderDisplayStatus;
  createdAt?: string | null;
  pickupTime?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  context?: ListingVariantContextResponse;
};

function parseCreatedAtMs(value?: string | null): number {
  if (!value?.trim()) return 0;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}

export function bookingToEnriched(order: BookingOrderResponse): EnrichedOrder {
  return {
    id: order.id,
    kind: "buy",
    listingVariantId: order.listingVariantId,
    customerId: order.customerId,
    customer: order.customer,
    price: order.price,
    quantity: order.quantity,
    status: order.status,
    createdAt: order.createdAt,
    pickupTime: order.pickupTime,
  };
}

export function rentalToEnriched(order: RentalOrderResponse): EnrichedOrder {
  return {
    id: order.id,
    kind: "rent",
    listingVariantId: order.listingVariantId,
    customerId: order.customerId,
    customer: order.customer,
    price: order.price,
    quantity: order.quantity,
    status: order.status,
    createdAt: order.createdAt,
    startTime: order.startTime,
    endTime: order.endTime,
  };
}

export function mergeOrdersNewestFirst(orders: EnrichedOrder[]): EnrichedOrder[] {
  return [...orders].sort((a, b) => parseCreatedAtMs(b.createdAt) - parseCreatedAtMs(a.createdAt));
}

export function mergeOrdersOldestFirst(orders: EnrichedOrder[]): EnrichedOrder[] {
  return [...orders].sort((a, b) => parseCreatedAtMs(a.createdAt) - parseCreatedAtMs(b.createdAt));
}

export function orderMatchesTab(
  order: EnrichedOrder,
  tab: OrderDisplayStatus | "all",
): boolean {
  if (tab === "all") return true;
  if (tab === "SHIPPED") return order.kind === "buy" && order.status === "SHIPPED";
  return order.status === tab;
}
