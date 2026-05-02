import { customFetch } from "@workspace/api-client-react";
import { unwrapApiData, type ApiResponseEnvelope, type PagedItemsResponse } from "./types";

export type ListingType = "BUY" | "RENT";

export type RentUnit = "HOUR" | "DAY" | "WEEK" | "MONTH";
export type ListingStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "SOLD"
  | "RENTED"
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export type ListingItemResponse = {
  id: string;
  title: string;
  description: string | null;
  listingType: ListingType;
  listingStatus: ListingStatus;
  minPrice: number | null;
  maxPrice: number | null;
  productId: string;
  productName: string | null;
  thumbnailImage: string | null;
};

export type GetFacilityListingPageParams = {
  page?: number;
  pageSize?: number;
};

export async function getFacilityListingPage(
  facilityId: string,
  params: GetFacilityListingPageParams = {},
): Promise<PagedItemsResponse<ListingItemResponse>> {
  const q = new URLSearchParams();
  if (params.page != null) q.set("page", String(params.page));
  if (params.pageSize != null) q.set("pageSize", String(params.pageSize));
  const qs = q.toString();
  const path = `/api/v1/listings/by-facility/${encodeURIComponent(facilityId)}${qs ? `?${qs}` : ""}`;
  const raw = await customFetch<ApiResponseEnvelope<PagedItemsResponse<ListingItemResponse>>>(path, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return unwrapApiData(raw);
}

export type ListingVariantCreateBody = {
  productVariantId: string;
  buyPrice?: number | null;
  rentPrice?: number | null;
  rentUnit?: RentUnit | null;
  isActive?: boolean | null;
};

export type ListingCreateBody = {
  productId: string;
  title: string;
  description?: string | null;
  listingType: ListingType;
  variants: ListingVariantCreateBody[];
};

export type ListingCreateResponse = {
  id: string;
  productId?: string | null;
  title: string;
  description?: string | null;
  listingType: ListingType;
};

export async function createListing(body: ListingCreateBody): Promise<ListingCreateResponse> {
  const raw = await customFetch<ApiResponseEnvelope<ListingCreateResponse>>(`/api/v1/listings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...body,
      description: body.description?.trim() ? body.description.trim() : null,
    }),
  });
  return unwrapApiData(raw);
}
