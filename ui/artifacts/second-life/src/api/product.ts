import { customFetch } from "@workspace/api-client-react";
import { unwrapApiData, type ApiResponseEnvelope, type PagedItemsResponse } from "./types";

export type ProductStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type ProductItemResponse = {
  id: string;
  name: string;
  thumbnailImage: string | null;
  status: ProductStatus;
  primarySubCategoryName: string | null;
  primarySubCategoryId?: string | null;
  variantCount: number;
  createdAt?: string | number[] | null;
};

export type PrimarySubcategorySummary = {
  id: string;
  name: string;
  productCount: number;
};

export type FacilityProductSort = "UPDATED_AT_DESC" | "CREATED_AT_DESC" | "RELEVANCE" | "NAME_ASC";

export type GetFacilityProductPageParams = {
  page?: number;
  pageSize?: number;
  /** Document `categoryIds` must contain every listed id (AND). */
  categoryIds?: string[] | null;
  /** Document `subCategoryIds` must contain every listed id (AND). */
  subCategoryIds?: string[] | null;
  keyword?: string | null;
  sortBy?: FacilityProductSort | null;
};

export async function getFacilityProductPage(
  facilityId: string,
  params: GetFacilityProductPageParams = {},
): Promise<PagedItemsResponse<ProductItemResponse>> {
  const q = new URLSearchParams();
  if (params.page != null) q.set("page", String(params.page));
  if (params.pageSize != null) q.set("pageSize", String(params.pageSize));
  if (params.keyword != null && params.keyword.trim()) q.set("keyword", params.keyword.trim());
  if (params.sortBy) q.set("sortBy", params.sortBy);
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
  const path = `/api/v1/products/by-facility/${encodeURIComponent(facilityId)}${qs ? `?${qs}` : ""}`;
  const raw = await customFetch<ApiResponseEnvelope<PagedItemsResponse<ProductItemResponse>>>(path, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return unwrapApiData(raw);
}

export async function getFacilityPrimarySubcategories(
  facilityId: string,
): Promise<PrimarySubcategorySummary[]> {
  const raw = await customFetch<ApiResponseEnvelope<PrimarySubcategorySummary[]>>(
    `/api/v1/products/by-facility/${encodeURIComponent(facilityId)}/primary-subcategories`,
    { method: "GET", headers: { "Content-Type": "application/json" } },
  );
  return unwrapApiData(raw);
}
