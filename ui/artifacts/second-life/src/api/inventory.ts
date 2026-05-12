import { customFetch } from "@workspace/api-client-react";

import type { ApiResponseEnvelope } from "./types";
import { unwrapApiData } from "./types";

export type InventoryModeApi = "BUY" | "RENT";

export type ListingVariantAvailabilityDto = {
  tracked: boolean;
  availableQuantity: number | null;
};

export type RentalPeriodDto = {
  reservationId: string;
  rentalStart?: string | null;
  rentalEnd?: string | null;
  slotStart?: string | null;
  slotEnd?: string | null;
  quantity?: number | null;
  status?: string | null;
};

export async function fetchListingVariantAvailability(
  listingVariantId: string,
  mode: InventoryModeApi,
): Promise<ListingVariantAvailabilityDto> {
  const q = new URLSearchParams({ mode });
  const path = `/api/v1/listing-variants/${encodeURIComponent(listingVariantId.trim())}/availability?${q.toString()}`;
  const raw = await customFetch<ApiResponseEnvelope<ListingVariantAvailabilityDto>>(path, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return unwrapApiData(raw);
}

export async function fetchListingRentalPeriods(listingVariantId: string): Promise<RentalPeriodDto[]> {
  const path = `/api/v1/listing-variants/${encodeURIComponent(listingVariantId.trim())}/rental-periods`;
  const raw = await customFetch<ApiResponseEnvelope<RentalPeriodDto[]>>(path, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const rows = unwrapApiData(raw);
  return Array.isArray(rows) ? rows : [];
}

export type ListingVariantIntervalAvailabilityDto = {
  tracked: boolean;
  availableQuantity: number | null;
  intervalStart?: string | null;
  intervalEnd?: string | null;
};

export async function fetchListingVariantAvailabilityInRange(
  listingVariantId: string,
  params: { from: string; to: string; mode?: InventoryModeApi },
): Promise<ListingVariantIntervalAvailabilityDto> {
  const q = new URLSearchParams({
    from: params.from,
    to: params.to,
    mode: params.mode ?? "RENT",
  });
  const path = `/api/v1/listing-variants/${encodeURIComponent(listingVariantId.trim())}/availability-in-range?${q.toString()}`;
  const raw = await customFetch<ApiResponseEnvelope<ListingVariantIntervalAvailabilityDto>>(path, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return unwrapApiData(raw);
}
