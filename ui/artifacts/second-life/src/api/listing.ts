import { customFetch } from "@workspace/api-client-react";
import { normalizeFacilityResponse } from "@/api/facility";
import { unwrapApiData, type ApiResponseEnvelope, type PagedItemsResponse } from "./types";
import { getSuggestionFromPrefix, setSuggestionCached } from "@/lib/suggestion-cache";

export type ListingType = "BUY" | "RENT";

export type RentUnit = "HOUR" | "DAY" | "WEEK" | "MONTH";
export type ListingStatus = "ACTIVE" | "INACTIVE" | "PENDING" | "REJECTED";

export const MANAGE_LISTING_STATUSES: ListingStatus[] = [
  "ACTIVE",
  "INACTIVE",
  "PENDING",
  "REJECTED",
];

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
  facilityId?: string | null;
  facilityName?: string | null;
  facilityImageUrl?: string | null;
  facilityAddress?: string | null;
  averageRating?: number | null;
  primarySubCategoryName?: string | null;
};

export type SearchListingsPagedResult = PagedItemsResponse<ListingItemResponse>;

export type GetFacilityListingPageParams = {
  page?: number;
  pageSize?: number;
  keyword?: string | null;
  productId?: string | null;
  listingStatus?: ListingStatus | null;
  listingType?: ListingType | null;
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
  facilityId?: string | null;
  productId?: string | null;
  listingStatus?: ListingStatus | null;
  listingType?: "BUY" | "RENT" | null;
  categoryId?: string | null;
  subCategoryId?: string | null;
  categoryIds?: string[] | null;
  subCategoryIds?: string[] | null;
  provinceCode?: string | null;
  wardCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  radiusMeters?: number | null;
  priceMin?: number | null;
  priceMax?: number | null;
  sortBy?: ListingSearchSort | null;
  page?: number | null;
  pageSize?: number | null;
};

export type SearchListingsOptions = {
  profileId?: string | null;
};

export function listingOptionalProfileHeaders(profileId?: string | null): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const id = profileId?.trim();
  if (id) headers["X-Profile-Id"] = id;
  return headers;
}

export async function searchListings(
  params: SearchListingsParams = {},
  options: SearchListingsOptions = {},
): Promise<SearchListingsPagedResult> {
  const q = new URLSearchParams();
  if (params.keyword != null && params.keyword.trim()) q.set("keyword", params.keyword.trim());
  if (params.facilityId?.trim()) q.set("facilityId", params.facilityId.trim());
  if (params.productId?.trim()) q.set("productId", params.productId.trim());
  if (params.listingStatus) q.set("listingStatus", params.listingStatus);
  if (params.listingType) q.set("listingType", params.listingType);
  if (params.sortBy) q.set("sortBy", params.sortBy);
  if (params.page != null) q.set("page", String(params.page));
  if (params.pageSize != null) q.set("pageSize", String(params.pageSize));
  if (params.priceMin != null && Number.isFinite(params.priceMin)) q.set("priceMin", String(params.priceMin));
  if (params.priceMax != null && Number.isFinite(params.priceMax)) q.set("priceMax", String(params.priceMax));
  if (params.provinceCode?.trim()) q.set("provinceCode", params.provinceCode.trim());
  if (params.wardCode?.trim()) q.set("wardCode", params.wardCode.trim());
  if (params.latitude != null && Number.isFinite(params.latitude)) {
    q.set("latitude", String(params.latitude));
  }
  if (params.longitude != null && Number.isFinite(params.longitude)) {
    q.set("longitude", String(params.longitude));
  }
  if (params.radiusMeters != null && Number.isFinite(params.radiusMeters) && params.radiusMeters > 0) {
    q.set("radiusMeters", String(params.radiusMeters));
  }
  if (params.categoryId?.trim()) q.set("categoryId", params.categoryId.trim());
  if (params.subCategoryId?.trim()) q.set("subCategoryId", params.subCategoryId.trim());
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
  const raw = await customFetch<ApiResponseEnvelope<SearchListingsPagedResult>>(`/api/v1/listings/search${qs ? `?${qs}` : ""}`, {
    method: "GET",
    headers: listingOptionalProfileHeaders(options.profileId),
  });
  return unwrapApiData(raw);
}

export type ListingRecommendationBody = {
  latitude?: number | null;
  longitude?: number | null;
  radiusMeters?: number | null;
  limit?: number | null;
};

export async function fetchListingRecommendations(
  body: ListingRecommendationBody,
  profileId?: string | null,
): Promise<ListingItemResponse[]> {
  const raw = await customFetch<ApiResponseEnvelope<ListingItemResponse[]>>(`/api/v1/listings/recommendations`, {
    method: "POST",
    headers: listingOptionalProfileHeaders(profileId),
    body: JSON.stringify({
      latitude: body.latitude ?? undefined,
      longitude: body.longitude ?? undefined,
      radiusMeters: body.radiusMeters ?? undefined,
      limit: body.limit ?? undefined,
    }),
  });
  const data = unwrapApiData<ListingItemResponse[]>(raw);
  return Array.isArray(data) ? data : [];
}

export async function fetchListingSuggestions(
  keyword: string,
  limit = 8,
): Promise<ListingSuggestionResponse[]> {
  const trimmed = keyword.trim();
  if (trimmed.length < 2) return [];

  // Serve from cache or derive from a shorter cached prefix (skips network call)
  const cached = getSuggestionFromPrefix(trimmed, limit);
  if (cached !== null) return cached;

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
  const result = Array.isArray(data) ? data : [];

  setSuggestionCached(trimmed, result);
  return result;
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
  if (params.listingStatus) q.set("listingStatus", params.listingStatus);
  if (params.listingType) q.set("listingType", params.listingType);
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
  quantity: number;
  buyPrice?: number | null;
  rentPrice?: number | null;
  rentUnit?: RentUnit | null;
  isActive?: boolean | null;
};

export type ListingCreateBody = {
  productId: string;
  facilityId: string;
  title: string;
  description?: string | null;
  listingType: ListingType;
  variants: ListingVariantCreateBody[];
};

export type ListingCreateResponse = {
  id: string;
  productId?: string | null;
  facilityId?: string | null;
  title: string;
  description?: string | null;
  listingType: ListingType;
};

export type ListingVariantResponse = {
  id: string;
  productVariantId: string;
  quantity: number;
  buyPrice?: number | null;
  rentPrice?: number | null;
  rentUnit?: RentUnit | null;
  isActive?: boolean | null;
};

export type ListingResponseDetailed = {
  id: string;
  productId: string;
  title: string;
  description?: string | null;
  listingType: ListingType;
  listingStatus: ListingStatus;
  minPrice?: number | null;
  maxPrice?: number | null;
  variants: ListingVariantResponse[];
};

export type ProductVariantSummaryDto = {
  id: string;
  sku?: string | null;
  label?: string | null;
  attributeValueIds?: string[] | null;
};

export type ProductMediaDto = {
  mediaUrl: string;
  mediaType?: string | null;
  isThumbnail?: boolean | null;
  sortOrder?: number | null;
};

export type CategoryRefDto = {
  id: string;
  name?: string | null;
};

export type FacilityOverviewDto = {
  id: string;
  name?: string | null;
  ownerId?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  linkGoogleMap?: string | null;
  address?: string | null;
  provinceCode?: string | null;
  wardCode?: string | null;
  averageRating?: number | null;
  orderCount?: number | null;
  viewCount?: number | null;
};

export type AttributeValueDto = {
  id?: string | null;
  value?: string | null;
  code?: string | null;
};

export type AttributeDto = {
  id?: string | null;
  name?: string | null;
  attributeValues?: AttributeValueDto[] | null;
};

export type ListingProductBundleDto = {
  id: string;
  name: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  ownerId?: string | null;
  primarySubCategory?: CategoryRefDto | null;
  medias?: ProductMediaDto[] | null;
  variants?: ProductVariantSummaryDto[] | null;
  attributes?: AttributeDto[] | null;
};

export type ListingPublicDetailResponse = {
  listing: ListingResponseDetailed;
  product: ListingProductBundleDto;
  facility?: FacilityOverviewDto | null;
};

export type ListingVariantContextResponse = {
  listingId: string;
  listingVariantId: string;
  facilityId?: string | null;
  title: string;
  productName?: string | null;
  variantLabel?: string | null;
  thumbnailUrl?: string | null;
  listingType: ListingType;
  buyPrice?: number | null;
  rentPrice?: number | null;
};

export async function fetchListingVariantContext(
  listingVariantId: string,
): Promise<ListingVariantContextResponse> {
  const raw = await customFetch<ApiResponseEnvelope<ListingVariantContextResponse>>(
    `/api/v1/listings/variants/${encodeURIComponent(listingVariantId.trim())}/context`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );
  return unwrapApiData(raw);
}

export async function fetchListingPublicDetail(
  listingId: string,
  options?: { listingVariantId?: string },
): Promise<ListingPublicDetailResponse> {
  const q = new URLSearchParams();
  const variantId = options?.listingVariantId?.trim();
  if (variantId) q.set("listingVariantId", variantId);
  const qs = q.toString();
  const raw = await customFetch<ApiResponseEnvelope<ListingPublicDetailResponse>>(
    `/api/v1/listings/${encodeURIComponent(listingId.trim())}${qs ? `?${qs}` : ""}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );
  const data = unwrapApiData<ListingPublicDetailResponse>(raw);
  const facility = data.facility ? normalizeFacilityResponse(data.facility) : null;
  return {
    ...data,
    facility: facility ?? data.facility,
  };
}

export async function adminApproveListing(listingId: string): Promise<ListingResponseDetailed> {
  const raw = await customFetch<ApiResponseEnvelope<ListingResponseDetailed>>(
    `/api/v1/listings/admin/${encodeURIComponent(listingId.trim())}/approve`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
  );
  return unwrapApiData(raw);
}

export async function adminRejectListing(listingId: string): Promise<ListingResponseDetailed> {
  const raw = await customFetch<ApiResponseEnvelope<ListingResponseDetailed>>(
    `/api/v1/listings/admin/${encodeURIComponent(listingId.trim())}/reject`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
  );
  return unwrapApiData(raw);
}

export async function adminListPendingListings(params: {
  page?: number;
  pageSize?: number;
} = {}): Promise<PagedItemsResponse<ListingItemResponse>> {
  const q = new URLSearchParams();
  if (params.page != null) q.set("page", String(params.page));
  if (params.pageSize != null) q.set("pageSize", String(params.pageSize));
  const qs = q.toString();
  const raw = await customFetch<ApiResponseEnvelope<PagedItemsResponse<ListingItemResponse>>>(
    `/api/v1/listings/admin/pending${qs ? `?${qs}` : ""}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );
  return unwrapApiData(raw);
}

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
