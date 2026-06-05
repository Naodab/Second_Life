import { customFetch } from "@workspace/api-client-react";

import type { ListingType, RentUnit } from "@/api/listing";
import { unwrapApiData, type ApiResponseEnvelope } from "./types";

export type CartModeApi = "BUY" | "RENT";

export type CartItemResponse = {
  id: string;
  listingId: string;
  listingVariantId: string;
  quantity: number;
  mode: CartModeApi;
  rentalStart?: string | null;
  rentalEnd?: string | null;
  rentUnit?: RentUnit | null;
  addedAt?: string | null;
  title?: string | null;
  productName?: string | null;
  variantLabel?: string | null;
  thumbnailUrl?: string | null;
  facilityId?: string | null;
  listingType?: ListingType | null;
  buyPrice?: number | null;
  rentPrice?: number | null;
};

export type CartItemAddPayload = {
  listingId: string;
  listingVariantId: string;
  quantity: number;
  mode: CartModeApi;
  rentalStart?: string;
  rentalEnd?: string;
  rentUnit?: RentUnit;
};

export type CartItemUpdatePayload = {
  quantity: number;
};

export async function listCartItems(): Promise<CartItemResponse[]> {
  const raw = await customFetch<ApiResponseEnvelope<CartItemResponse[]>>("/api/v1/cart", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const rows = unwrapApiData(raw);
  return Array.isArray(rows) ? rows : [];
}

export async function addCartItem(payload: CartItemAddPayload): Promise<CartItemResponse> {
  const raw = await customFetch<ApiResponseEnvelope<CartItemResponse>>("/api/v1/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return unwrapApiData(raw);
}

export async function updateCartItem(id: string, payload: CartItemUpdatePayload): Promise<CartItemResponse> {
  const raw = await customFetch<ApiResponseEnvelope<CartItemResponse>>(
    `/api/v1/cart/${encodeURIComponent(id.trim())}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return unwrapApiData(raw);
}

export async function removeCartItem(id: string): Promise<void> {
  await customFetch(`/api/v1/cart/${encodeURIComponent(id.trim())}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
}

export async function clearCart(): Promise<void> {
  await customFetch("/api/v1/cart", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
}
