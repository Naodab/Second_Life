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
  keyword?: string | null;
  productId?: string | null;
};

export type ListingSearchSort =
  | "UPDATED_AT_DESC"
  | "CREATED_AT_DESC"
  | "RELEVANCE"
  | "NAME_ASC"
  | "DISTANCE";

export type ListingSuggestionResponse = {
  id: string;
  title: string;
  productId: string;
};

export type SearchListingsParams = {
  keyword?: string | null;
  listingType?: "BUY" | "RENT" | null;
  categoryIds?: string[] | null;
  subCategoryIds?: string[] | null;
  provinceCode?: string | null;
  wardCode?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  sortBy?: ListingSearchSort | null;
  page?: number | null;
  pageSize?: number | null;
};

export async function searchListings(
  params: SearchListingsParams = {},
): Promise<ListingItemResponse[]> {
  const q = new URLSearchParams();
  if (params.keyword != null && params.keyword.trim()) q.set("keyword", params.keyword.trim());
  if (params.listingType) q.set("listingType", params.listingType);
  if (params.sortBy) q.set("sortBy", params.sortBy);
  if (params.page != null) q.set("page", String(params.page));
  if (params.pageSize != null) q.set("pageSize", String(params.pageSize));
  if (params.priceMin != null && Number.isFinite(params.priceMin)) q.set("priceMin", String(params.priceMin));
  if (params.priceMax != null && Number.isFinite(params.priceMax)) q.set("priceMax", String(params.priceMax));
  if (params.provinceCode?.trim()) q.set("provinceCode", params.provinceCode.trim());
  if (params.wardCode?.trim()) q.set("wardCode", params.wardCode.trim());
  if (params.categoryIds?.length) {
    for (const id of params.categoryIds) {
      if (id?.trim()) q.append("categoryIds", id.trim());
    }
  }
  if (params.subCategoryIds?.length) {
    for (const id of params.subCategoryIds) {
      if (id?.trim()) q.append("subCategoryIds", id.trim());
    }
  }
  const qs = q.toString();
  const raw = await customFetch<ApiResponseEnvelope<ListingItemResponse[]>>(`/api/v1/listings/search${qs ? `?${qs}` : ""}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return unwrapApiData(raw);
}

export async function fetchListingSuggestions(
  keyword: string,
  limit = 8,
): Promise<ListingSuggestionResponse[]> {
  const trimmed = keyword.trim();
  if (trimmed.length < 2) return [];
  const q = new URLSearchParams({
    keyword: trimmed,
    limit: String(limit),
  });
  const raw = await customFetch<ApiResponseEnvelope<ListingSuggestionResponse[]>>(
    `/api/v1/listings/suggestions?${q.toString()}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );
  const data = unwrapApiData<ListingSuggestionResponse[]>(raw);
  return Array.isArray(data) ? data : [];
}

export async function getFacilityListingPage(
  facilityId: string,
  params: GetFacilityListingPageParams = {},
): Promise<PagedItemsResponse<ListingItemResponse>> {
  const q = new URLSearchParams();
  if (params.page != null) q.set("page", String(params.page));
  if (params.pageSize != null) q.set("pageSize", String(params.pageSize));
  if (params.keyword != null && params.keyword.trim()) q.set("keyword", params.keyword.trim());
  if (params.productId != null && params.productId.trim()) q.set("productId", params.productId.trim());
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
