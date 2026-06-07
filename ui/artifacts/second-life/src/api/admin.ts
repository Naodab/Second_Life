import { customFetch } from "@workspace/api-client-react";
import type { BookingOrderResponse, BookingOrderStatus } from "./booking";
import type { RentalOrderResponse, RentalOrderStatus } from "./rental";
import { unwrapApiData, type ApiResponseEnvelope, type PagedItemsResponse } from "./types";

export type AdminAccountRole = "USER" | "ADMIN";
export type AdminAuthProvider = "LOCAL" | "GOOGLE";

export type AdminAccountProfileSummary = {
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
};

export type AdminAccountResponse = {
  id: string;
  email: string;
  role: AdminAccountRole;
  authProvider: AdminAuthProvider;
  emailVerified: boolean;
  active: boolean;
  profileId?: string | null;
  createdAt?: string | null;
  profile?: AdminAccountProfileSummary | null;
};

export type AdminListAccountsParams = {
  page?: number;
  pageSize?: number;
  accountRole?: AdminAccountRole | null;
  emailVerified?: boolean | null;
  keyword?: string | null;
};

export type AdminListOrdersParams = {
  page?: number;
  pageSize?: number;
  status?: BookingOrderStatus | RentalOrderStatus | null;
  buyerProfileId?: string | null;
  sellerProfileId?: string | null;
};

export type AdminAccountSellerActivitySummary = {
  facilities: number;
  products: number;
  listings: number;
  buyOrdersReceived: number;
  rentOrdersReceived: number;
};

export type AdminAccountBuyerActivitySummary = {
  buyOrders: number;
  rentOrders: number;
};

export type AdminAccountActivitySummary = {
  seller: AdminAccountSellerActivitySummary;
  buyer: AdminAccountBuyerActivitySummary;
};

export type AdminListProductsByOwnerParams = {
  ownerId: string;
  page?: number;
  pageSize?: number;
  keyword?: string | null;
  status?: import("./product").ProductStatus | null;
};

export type AdminListListingsByOwnerParams = {
  ownerId: string;
  page?: number;
  pageSize?: number;
  listingStatus?: import("./listing").ListingStatus | null;
};

export async function adminListAccounts(
  params: AdminListAccountsParams = {},
): Promise<PagedItemsResponse<AdminAccountResponse>> {
  const q = new URLSearchParams();
  if (params.page != null) q.set("page", String(params.page));
  if (params.pageSize != null) q.set("pageSize", String(params.pageSize));
  if (params.accountRole) q.set("accountRole", params.accountRole);
  if (params.emailVerified != null) q.set("emailVerified", String(params.emailVerified));
  if (params.keyword?.trim()) q.set("keyword", params.keyword.trim());
  const qs = q.toString();
  const raw = await customFetch<ApiResponseEnvelope<PagedItemsResponse<AdminAccountResponse>>>(
    `/api/v1/auth/admin/accounts${qs ? `?${qs}` : ""}`,
    { method: "GET", headers: { "Content-Type": "application/json" } },
  );
  return unwrapApiData(raw);
}

export async function adminGetAccount(accountId: string): Promise<AdminAccountResponse> {
  const raw = await customFetch<ApiResponseEnvelope<AdminAccountResponse>>(
    `/api/v1/auth/admin/accounts/${encodeURIComponent(accountId.trim())}`,
    { method: "GET", headers: { "Content-Type": "application/json" } },
  );
  return unwrapApiData(raw);
}

export async function adminGetAccountActivitySummary(
  accountId: string,
): Promise<AdminAccountActivitySummary> {
  const raw = await customFetch<ApiResponseEnvelope<AdminAccountActivitySummary>>(
    `/api/v1/auth/admin/accounts/${encodeURIComponent(accountId.trim())}/activity-summary`,
    { method: "GET", headers: { "Content-Type": "application/json" } },
  );
  return unwrapApiData(raw);
}

export async function adminListProductsByOwner(
  params: AdminListProductsByOwnerParams,
): Promise<PagedItemsResponse<import("./product").ProductItemResponse>> {
  const q = new URLSearchParams();
  q.set("ownerId", params.ownerId.trim());
  if (params.page != null) q.set("page", String(params.page));
  if (params.pageSize != null) q.set("pageSize", String(params.pageSize));
  if (params.keyword?.trim()) q.set("keyword", params.keyword.trim());
  if (params.status) q.set("status", params.status);
  const raw = await customFetch<
    ApiResponseEnvelope<PagedItemsResponse<import("./product").ProductItemResponse>>
  >(`/api/v1/products/admin/by-owner?${q.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return unwrapApiData(raw);
}

export async function adminListListingsByOwner(
  params: AdminListListingsByOwnerParams,
): Promise<PagedItemsResponse<import("./listing").ListingItemResponse>> {
  const q = new URLSearchParams();
  q.set("ownerId", params.ownerId.trim());
  if (params.page != null) q.set("page", String(params.page));
  if (params.pageSize != null) q.set("pageSize", String(params.pageSize));
  if (params.listingStatus) q.set("listingStatus", params.listingStatus);
  const raw = await customFetch<
    ApiResponseEnvelope<PagedItemsResponse<import("./listing").ListingItemResponse>>
  >(`/api/v1/listings/admin/by-owner?${q.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return unwrapApiData(raw);
}

export async function adminListBuyOrders(
  params: AdminListOrdersParams = {},
): Promise<PagedItemsResponse<BookingOrderResponse>> {
  const q = new URLSearchParams();
  if (params.page != null) q.set("page", String(params.page));
  if (params.pageSize != null) q.set("pageSize", String(params.pageSize));
  if (params.status) q.set("status", params.status);
  if (params.buyerProfileId?.trim()) q.set("buyerProfileId", params.buyerProfileId.trim());
  if (params.sellerProfileId?.trim()) q.set("sellerProfileId", params.sellerProfileId.trim());
  const qs = q.toString();
  const raw = await customFetch<ApiResponseEnvelope<PagedItemsResponse<BookingOrderResponse>>>(
    `/api/v1/orders/admin${qs ? `?${qs}` : ""}`,
    { method: "GET", headers: { "Content-Type": "application/json" } },
  );
  return unwrapApiData(raw);
}

export async function adminListRentOrders(
  params: AdminListOrdersParams = {},
): Promise<PagedItemsResponse<RentalOrderResponse>> {
  const q = new URLSearchParams();
  if (params.page != null) q.set("page", String(params.page));
  if (params.pageSize != null) q.set("pageSize", String(params.pageSize));
  if (params.status) q.set("status", params.status);
  if (params.buyerProfileId?.trim()) q.set("buyerProfileId", params.buyerProfileId.trim());
  if (params.sellerProfileId?.trim()) q.set("sellerProfileId", params.sellerProfileId.trim());
  const qs = q.toString();
  const raw = await customFetch<ApiResponseEnvelope<PagedItemsResponse<RentalOrderResponse>>>(
    `/api/v1/rental-orders/admin${qs ? `?${qs}` : ""}`,
    { method: "GET", headers: { "Content-Type": "application/json" } },
  );
  return unwrapApiData(raw);
}
