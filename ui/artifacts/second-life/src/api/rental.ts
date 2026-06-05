import { format } from "date-fns";
import { customFetch } from "@workspace/api-client-react";
import { normalizeBookingOrderCustomer, type BookingOrderCustomerResponse } from "@/api/booking";
import { unwrapApiData, type ApiResponseEnvelope } from "./types";

export type RentalOrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "DELIVERED"
  | "RETURNED"
  | "COMPLETED"
  | "CANCELLED";

export type RentalOrderCreateBody = {
  listingVariantId: string;
  customerId: string;
  startTime: string;
  endTime: string;
  quantity: number;
};

export type RentalOrderResponse = {
  id: string;
  listingVariantId: string;
  customerId: string;
  customer?: BookingOrderCustomerResponse | null;
  price?: number | null;
  startTime: string;
  endTime: string;
  quantity: number;
  status: RentalOrderStatus;
  createdAt?: string | null;
};

export function formatRentalDateTime(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm:ss");
}

function normalizeRentalOrder(raw: unknown): RentalOrderResponse | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = o.id != null ? String(o.id) : "";
  const listingVariantId =
    o.listingVariantId != null
      ? String(o.listingVariantId)
      : o.listing_variant_id != null
        ? String(o.listing_variant_id)
        : "";
  if (!id || !listingVariantId) return null;

  const statusRaw = String(o.status ?? "PENDING").toUpperCase();
  const status = (
    ["PENDING", "CONFIRMED", "DELIVERED", "RETURNED", "COMPLETED", "CANCELLED"] as const
  ).includes(statusRaw as RentalOrderStatus)
    ? (statusRaw as RentalOrderStatus)
    : "PENDING";

  const customerRaw = o.customer;
  const customer =
    customerRaw != null ? normalizeBookingOrderCustomer(customerRaw) : null;

  return {
    id,
    listingVariantId,
    customerId: String(o.customerId ?? o.customer_id ?? customer?.id ?? ""),
    customer,
    price: o.price != null ? Number(o.price) : null,
    startTime: String(o.startTime ?? o.start_time ?? ""),
    endTime: String(o.endTime ?? o.end_time ?? ""),
    quantity: Number(o.quantity ?? 1),
    status,
    createdAt: (o.createdAt ?? o.created_at ?? null) as string | null,
  };
}

export async function createRentalOrder(
  body: RentalOrderCreateBody,
): Promise<RentalOrderResponse> {
  const raw = await customFetch<ApiResponseEnvelope<RentalOrderResponse> | RentalOrderResponse>(
    "/api/v1/rental-orders",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (raw && typeof raw === "object" && "data" in raw) {
    const parsed = normalizeRentalOrder((raw as ApiResponseEnvelope<unknown>).data);
    if (parsed) return parsed;
  }
  const direct = normalizeRentalOrder(raw);
  if (direct) return direct;
  throw new Error("Invalid rental order response");
}

export async function cancelRentalOrder(orderId: string): Promise<void> {
  await customFetch<void>(`/api/v1/rental-orders/${encodeURIComponent(orderId.trim())}`, {
    method: "DELETE",
  });
}

export async function updateRentalOrderStatus(
  orderId: string,
  status: RentalOrderStatus,
): Promise<RentalOrderResponse> {
  const raw = await customFetch<ApiResponseEnvelope<RentalOrderResponse> | RentalOrderResponse>(
    `/api/v1/rental-orders/${encodeURIComponent(orderId.trim())}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
  );
  if (raw && typeof raw === "object" && "data" in raw) {
    const parsed = normalizeRentalOrder((raw as ApiResponseEnvelope<unknown>).data);
    if (parsed) return parsed;
  }
  const direct = normalizeRentalOrder(raw);
  if (direct) return direct;
  throw new Error("Invalid rental order response");
}

export async function listRentalOrders(): Promise<RentalOrderResponse[]> {
  const raw = await customFetch<unknown>("/api/v1/rental-orders", { method: "GET" });
  return parseRentalOrderList(raw);
}

export async function listFacilityRentalOrders(facilityId: string): Promise<RentalOrderResponse[]> {
  const raw = await customFetch<unknown>(
    `/api/v1/rental-orders/by-facility/${encodeURIComponent(facilityId.trim())}`,
    { method: "GET" },
  );
  return parseRentalOrderList(raw);
}

function parseRentalOrderList(raw: unknown): RentalOrderResponse[] {
  if (Array.isArray(raw)) {
    return raw.map(normalizeRentalOrder).filter((o): o is RentalOrderResponse => o != null);
  }
  if (raw && typeof raw === "object" && "data" in raw) {
    return parseRentalOrderList((raw as ApiResponseEnvelope<unknown>).data);
  }
  return [];
}
