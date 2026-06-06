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

export async function adminListBuyOrders(
  params: AdminListOrdersParams = {},
): Promise<PagedItemsResponse<BookingOrderResponse>> {
  const q = new URLSearchParams();
  if (params.page != null) q.set("page", String(params.page));
  if (params.pageSize != null) q.set("pageSize", String(params.pageSize));
  if (params.status) q.set("status", params.status);
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
  const qs = q.toString();
  const raw = await customFetch<ApiResponseEnvelope<PagedItemsResponse<RentalOrderResponse>>>(
    `/api/v1/rental-orders/admin${qs ? `?${qs}` : ""}`,
    { method: "GET", headers: { "Content-Type": "application/json" } },
  );
  return unwrapApiData(raw);
}
