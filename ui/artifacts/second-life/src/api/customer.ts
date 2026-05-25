import { customFetch } from "@workspace/api-client-react";
import { unwrapApiData, type ApiResponseEnvelope } from "./types";

export type SavedCustomer = {
  id: string;
  profileId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  address: string;
  provinceCode: string;
  wardCode: string;
  provinceName?: string | null;
  wardName?: string | null;
  isDefault: boolean;
};

export type CustomerUpsertBody = {
  customer: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email: string;
    address: string;
    provinceCode: string;
    wardCode: string;
  };
  setAsDefault?: boolean;
};

function normalizeSavedCustomer(raw: unknown): SavedCustomer | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Record<string, unknown>;
  const id = c.id != null ? String(c.id) : "";
  if (!id) return null;

  const isDefault = c.isDefault === true || c.default === true;

  return {
    id,
    profileId: String(c.profileId ?? c.profile_id ?? ""),
    firstName: String(c.firstName ?? c.first_name ?? ""),
    lastName: String(c.lastName ?? c.last_name ?? ""),
    phoneNumber: String(c.phoneNumber ?? c.phone_number ?? ""),
    email: String(c.email ?? ""),
    address: String(c.address ?? ""),
    provinceCode: String(c.provinceCode ?? c.province_code ?? "").trim(),
    wardCode: String(c.wardCode ?? c.ward_code ?? "").trim(),
    provinceName: (c.provinceName ?? c.province_name ?? null) as string | null,
    wardName: (c.wardName ?? c.ward_name ?? null) as string | null,
    isDefault,
  };
}

function parseCustomerList(raw: unknown): SavedCustomer[] {
  if (Array.isArray(raw)) {
    return raw.map(normalizeSavedCustomer).filter((c): c is SavedCustomer => c != null);
  }
  if (raw && typeof raw === "object" && "data" in raw) {
    return parseCustomerList((raw as ApiResponseEnvelope<unknown>).data);
  }
  return [];
}

function parseCustomerOne(raw: unknown): SavedCustomer {
  if (raw && typeof raw === "object" && "data" in raw) {
    const inner = parseCustomerOne((raw as ApiResponseEnvelope<unknown>).data);
    if (inner.id) return inner;
  }
  const normalized = normalizeSavedCustomer(raw);
  if (normalized) return normalized;
  throw new Error("Invalid customer response");
}

export async function listCustomers(): Promise<SavedCustomer[]> {
  const raw = await customFetch<unknown>("/api/v1/customers", {
    method: "GET",
  });
  return parseCustomerList(raw);
}

export async function createCustomer(body: CustomerUpsertBody): Promise<SavedCustomer> {
  const raw = await customFetch<unknown>("/api/v1/customers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseCustomerOne(raw);
}

export async function updateCustomer(id: string, body: CustomerUpsertBody): Promise<SavedCustomer> {
  const raw = await customFetch<unknown>(
    `/api/v1/customers/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  return parseCustomerOne(raw);
}

export async function setDefaultCustomer(id: string): Promise<SavedCustomer> {
  const raw = await customFetch<unknown>(
    `/api/v1/customers/${encodeURIComponent(id)}/default`,
    { method: "PUT" },
  );
  return parseCustomerOne(raw);
}

export function savedCustomerToOrderInfo(c: SavedCustomer) {
  return {
    firstName: c.firstName,
    lastName: c.lastName,
    phoneNumber: c.phoneNumber,
    email: c.email,
    address: c.address,
    provinceCode: c.provinceCode ?? "",
    wardCode: c.wardCode ?? "",
  };
}
