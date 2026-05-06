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
  categoryIds?: string[] | null;
  subCategoryIds?: string[] | null;
  keyword?: string | null;
  sortBy?: FacilityProductSort | null;
};

export type GetOwnedProductPageParams = GetFacilityProductPageParams & {
  status?: ProductStatus | null;
};

export async function getOwnedProductPage(
  params: GetOwnedProductPageParams = {},
): Promise<PagedItemsResponse<ProductItemResponse>> {
  const q = new URLSearchParams();
  if (params.page != null) q.set("page", String(params.page));
  if (params.pageSize != null) q.set("pageSize", String(params.pageSize));
  if (params.keyword != null && params.keyword.trim()) q.set("keyword", params.keyword.trim());
  if (params.sortBy) q.set("sortBy", params.sortBy);
  if (params.status) q.set("status", params.status);
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
  const raw = await customFetch<ApiResponseEnvelope<PagedItemsResponse<ProductItemResponse>>>(
    `/api/v1/products/owned${qs ? `?${qs}` : ""}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );
  return unwrapApiData(raw);
}

export async function getFacilityProductPage(
  _facilityId: string,
  params: GetFacilityProductPageParams = {},
): Promise<PagedItemsResponse<ProductItemResponse>> {
  return getOwnedProductPage(params);
}

export async function getFacilityPrimarySubcategories(
  _facilityId: string,
): Promise<PrimarySubcategorySummary[]> {
  const raw = await customFetch<ApiResponseEnvelope<PrimarySubcategorySummary[]>>(
    `/api/v1/products/owned/primary-subcategories`,
    { method: "GET", headers: { "Content-Type": "application/json" } },
  );
  return unwrapApiData(raw);
}

export type ProductCreateBody = {
  name: string;
  description?: string;
  subCategoryIds: string[];
  primarySubCategoryId: string;
  attributeIds: string[];
  variants: { quantity: number; attributeValueIds: string[] }[];
};

export type ProductCreateResponse = {
  id: string;
  name: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  status?: ProductStatus;
};

export type ProductVariantSummaryResponse = {
  id: string;
  sku?: string | null;
  quantity?: number | null;
  label?: string | null;
  attributeValueIds?: string[] | null;
};

export type ProductMediaResponse = {
  id?: string;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  isThumbnail?: boolean | null;
  sortOrder?: number | null;
};

export type SellerCategoryRef = {
  id: string;
  name?: string | null;
  code?: string | null;
};

export type OwnedProductDetailResponse = {
  id: string;
  name: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  status?: ProductStatus;
  ownerId?: string | null;
  primarySubCategory?: SellerCategoryRef | null;
  subCategories?: SellerCategoryRef[] | null;
  attributes?: { id: string; name?: string | null }[] | null;
  medias?: ProductMediaResponse[] | null;
  variants?: ProductVariantSummaryResponse[] | null;
};

export type UploadProductImagesBody = {
  thumbnailUrl: string;
  productImageUrls: string[];
  videoUrl?: string | null;
};

export type ProductVariantUpdatePayload = {
  id?: string | null;
  quantity: number;
  attributeValueIds: string[];
};

export type ProductUpdateBody = {
  name: string;
  description?: string | null;
  subCategoryIds: string[];
  primarySubCategoryId: string;
  attributeIds: string[];
  variants: ProductVariantUpdatePayload[];
};

export async function createProduct(body: ProductCreateBody): Promise<ProductCreateResponse> {
  const raw = await customFetch<ApiResponseEnvelope<ProductCreateResponse>>(`/api/v1/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return unwrapApiData(raw);
}

export async function getOwnedProductWithVariants(
  productId: string,
): Promise<OwnedProductDetailResponse> {
  const raw = await customFetch<ApiResponseEnvelope<OwnedProductDetailResponse>>(
    `/api/v1/products/${encodeURIComponent(productId)}`,
    { method: "GET", headers: { "Content-Type": "application/json" } },
  );
  return unwrapApiData(raw);
}

export async function getProductVariants(productId: string): Promise<ProductVariantSummaryResponse[]> {
  const raw = await customFetch<ApiResponseEnvelope<ProductVariantSummaryResponse[]>>(
    `/api/v1/products/${encodeURIComponent(productId)}/variants`,
    { method: "GET", headers: { "Content-Type": "application/json" } },
  );
  return unwrapApiData(raw);
}

export async function uploadProductImages(
  productId: string,
  body: UploadProductImagesBody,
): Promise<void> {
  const payload: Record<string, unknown> = {
    thumbnailUrl: body.thumbnailUrl.trim(),
    productImageUrls: body.productImageUrls.map((u) => u.trim()).filter(Boolean),
  };
  const v = body.videoUrl?.trim();
  if (v) {
    payload.videoUrl = v;
  }
  await customFetch<ApiResponseEnvelope<unknown>>(`/api/v1/products/${encodeURIComponent(productId)}/images`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateProduct(productId: string, body: ProductUpdateBody): Promise<OwnedProductDetailResponse> {
  const raw = await customFetch<ApiResponseEnvelope<OwnedProductDetailResponse>>(
    `/api/v1/products/${encodeURIComponent(productId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  return unwrapApiData(raw);
}

export async function publishDraftProduct(productId: string): Promise<OwnedProductDetailResponse> {
  const raw = await customFetch<ApiResponseEnvelope<OwnedProductDetailResponse>>(
    `/api/v1/products/${encodeURIComponent(productId)}/publish`,
    { method: "POST", headers: { "Content-Type": "application/json" } },
  );
  return unwrapApiData(raw);
}
