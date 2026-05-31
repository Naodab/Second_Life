import { customFetch } from "@workspace/api-client-react";
import { unwrapApiData, type ApiResponseEnvelope } from "./types";

export type BookingOrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type BookingOrderCustomerResponse = {
  id: string;
  profileId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  address?: string | null;
  provinceCode?: string | null;
  wardCode?: string | null;
  provinceName?: string | null;
  wardName?: string | null;
  isDefault?: boolean;
};

export type BookingOrderCreateBody = {
  listingVariantId: string;
  quantity: number;
  pickupTime: string;
  customerId: string;
};

export type BookingOrderResponse = {
  id: string;
  customerId: string;
  customer?: BookingOrderCustomerResponse | null;
  listingVariantId: string;
  price?: number | null;
  quantity: number;
  pickupTime: string;
  status: BookingOrderStatus;
  createdAt?: string | null;
};

function normalizeBookingOrderCustomer(raw: unknown): BookingOrderCustomerResponse | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = o.id != null ? String(o.id) : "";
  if (!id) return null;
  return {
    id,
    profileId: (o.profileId ?? o.profile_id ?? null) as string | null,
    firstName: (o.firstName ?? o.first_name ?? null) as string | null,
    lastName: (o.lastName ?? o.last_name ?? null) as string | null,
    phoneNumber: (o.phoneNumber ?? o.phone_number ?? null) as string | null,
    email: (o.email ?? null) as string | null,
    address: (o.address ?? null) as string | null,
    provinceCode: (o.provinceCode ?? o.province_code ?? null) as string | null,
    wardCode: (o.wardCode ?? o.ward_code ?? null) as string | null,
    provinceName: (o.provinceName ?? o.province_name ?? null) as string | null,
    wardName: (o.wardName ?? o.ward_name ?? null) as string | null,
    isDefault: Boolean(o.isDefault ?? o.defaultCustomer ?? o.default_customer ?? false),
  };
}

function normalizeBookingOrder(raw: unknown): BookingOrderResponse | null {
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
    ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] as const
  ).includes(statusRaw as BookingOrderStatus)
    ? (statusRaw as BookingOrderStatus)
    : "PENDING";

  const customerRaw = o.customer;
  const customer =
    customerRaw != null ? normalizeBookingOrderCustomer(customerRaw) : null;

  return {
    id,
    customerId: String(o.customerId ?? o.customer_id ?? customer?.id ?? ""),
    customer,
    listingVariantId,
    price: o.price != null ? Number(o.price) : null,
    quantity: Number(o.quantity ?? 1),
    pickupTime: String(o.pickupTime ?? o.pickup_time ?? ""),
    status,
    createdAt: (o.createdAt ?? o.created_at ?? null) as string | null,
  };
}

function parseBookingOrderList(raw: unknown): BookingOrderResponse[] {
  if (Array.isArray(raw)) {
    return raw.map(normalizeBookingOrder).filter((o): o is BookingOrderResponse => o != null);
  }
  if (raw && typeof raw === "object" && "data" in raw) {
    return parseBookingOrderList((raw as ApiResponseEnvelope<unknown>).data);
  }
  return [];
}

export async function listBookingOrders(): Promise<BookingOrderResponse[]> {
  const raw = await customFetch<unknown>("/api/v1/orders", { method: "GET" });
  return parseBookingOrderList(raw);
}

export async function listFacilityBookingOrders(facilityId: string): Promise<BookingOrderResponse[]> {
  const raw = await customFetch<unknown>(
    `/api/v1/orders/by-facility/${encodeURIComponent(facilityId.trim())}`,
    { method: "GET" },
  );
  return parseBookingOrderList(raw);
}

export async function cancelBookingOrder(orderId: string): Promise<void> {
  await customFetch<void>(`/api/v1/orders/${encodeURIComponent(orderId.trim())}`, {
    method: "DELETE",
  });
}

export async function updateBookingOrderStatus(
  orderId: string,
  status: BookingOrderStatus,
): Promise<BookingOrderResponse> {
  const raw = await customFetch<ApiResponseEnvelope<BookingOrderResponse> | BookingOrderResponse>(
    `/api/v1/orders/${encodeURIComponent(orderId.trim())}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
  );
  if (raw && typeof raw === "object" && "data" in raw) {
    const parsed = normalizeBookingOrder((raw as ApiResponseEnvelope<unknown>).data);
    if (parsed) return parsed;
  }
  const direct = normalizeBookingOrder(raw);
  if (direct) return direct;
  throw new Error("Invalid booking order response");
}

export async function createBookingOrder(
  body: BookingOrderCreateBody,
): Promise<BookingOrderResponse> {
  const raw = await customFetch<ApiResponseEnvelope<BookingOrderResponse> | BookingOrderResponse>(
    "/api/v1/orders",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (raw && typeof raw === "object" && "data" in raw) {
    const parsed = normalizeBookingOrder((raw as ApiResponseEnvelope<unknown>).data);
    if (parsed) return parsed;
  }
  const direct = normalizeBookingOrder(raw);
  if (direct) return direct;
  throw new Error("Invalid booking order response");
}

export function buildDefaultPickupTime(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T12:00:00`;
}

export function customerDisplayName(customer?: BookingOrderCustomerResponse | null): string {
  if (!customer) return "Khách hàng";
  const parts = [customer.firstName?.trim(), customer.lastName?.trim()].filter(Boolean);
  if (parts.length > 0) return parts.join(" ");
  if (customer.phoneNumber?.trim()) return customer.phoneNumber.trim();
  if (customer.email?.trim()) return customer.email.trim();
  return "Khách hàng";
}

export function customerAddressLine(customer?: BookingOrderCustomerResponse | null): string {
  if (!customer) return "—";
  const parts = [
    customer.address?.trim(),
    customer.wardName?.trim(),
    customer.provinceName?.trim(),
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "—";
}
