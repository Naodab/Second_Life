import { customFetch } from "@workspace/api-client-react";
import { unwrapApiData, type ApiResponseEnvelope } from "./types";

export const FACILITY_GOOGLE_MAP_LINK_MAX = 4096;

export function normalizeGoogleMapsShareUrl(raw: string): string {
  const trimmed = raw.trim();
  try {
    const u = new URL(trimmed);
    const host = u.hostname.toLowerCase();
    if (!host.includes("google.") || !u.pathname.includes("maps")) {
      return trimmed;
    }
    u.searchParams.delete("g_ep");
    u.searchParams.delete("entry");
    u.searchParams.delete("utm_source");
    u.searchParams.delete("utm_medium");
    u.searchParams.delete("utm_campaign");
    return u.toString();
  } catch {
    return trimmed;
  }
}

export type FacilityCreateBody = {
  name: string;
  description?: string;
  linkGoogleMap: string;
  address: string;
  provinceCode: string;
  wardCode: string;
  email: string;
  phoneNumber: string;
};

export type FacilityResponse = {
  id: string;
  name: string;
  ownerId: string;
  description?: string | null;
  imageUrl?: string | null;
  linkGoogleMap: string;
  address: string;
  provinceCode: string;
  wardCode: string;
  email?: string | null;
  phoneNumber?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  viewCount?: number | null;
  orderCount?: number | null;
  averageRating?: number | null;
};

export const DEFAULT_FACILITY_AVATAR =
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop";

export type FacilityWithPlaceNames = FacilityResponse & {
  provinceName: string;
  wardName: string;
};

export function facilityAvatarUrl(f: Pick<FacilityResponse, "imageUrl">): string {
  return f.imageUrl?.trim() || DEFAULT_FACILITY_AVATAR;
}

/** Chuẩn hóa facility từ listing/detail (camelCase hoặc snake_case). */
export function normalizeFacilityResponse(raw: unknown): FacilityResponse | null {
  if (!raw || typeof raw !== "object") return null;
  const f = raw as Record<string, unknown>;
  const id = String(f.id ?? "").trim();
  if (!id) return null;
  const phone = String(f.phoneNumber ?? f.phone_number ?? "").trim();
  const email = String(f.email ?? "").trim();
  return {
    id,
    name: String(f.name ?? "").trim(),
    ownerId: String(f.ownerId ?? f.owner_id ?? "").trim(),
    description: (f.description as string | null) ?? null,
    imageUrl: (f.imageUrl ?? f.image_url ?? null) as string | null,
    linkGoogleMap: String(f.linkGoogleMap ?? f.link_google_map ?? "").trim(),
    address: String(f.address ?? "").trim(),
    provinceCode: String(f.provinceCode ?? f.province_code ?? "").trim(),
    wardCode: String(f.wardCode ?? f.ward_code ?? "").trim(),
    email: email || null,
    phoneNumber: phone || null,
    latitude: (f.latitude as number | null) ?? null,
    longitude: (f.longitude as number | null) ?? null,
    viewCount: (f.viewCount ?? f.view_count ?? null) as number | null,
    orderCount: (f.orderCount ?? f.order_count ?? null) as number | null,
    averageRating: (f.averageRating ?? f.average_rating ?? null) as number | null,
  };
}

export async function getFacilityById(id: string): Promise<FacilityResponse> {
  const raw = await customFetch<ApiResponseEnvelope<unknown>>(
    `/api/v1/facilities/${encodeURIComponent(id.trim())}`,
    { method: "GET" },
  );
  const data = normalizeFacilityResponse(unwrapApiData(raw));
  if (!data) {
    throw new Error("Không đọc được thông tin cơ sở.");
  }
  return data;
}

export async function createFacility(body: FacilityCreateBody): Promise<FacilityResponse> {
  const linkGoogleMap = normalizeGoogleMapsShareUrl(body.linkGoogleMap);
  const raw = await customFetch<ApiResponseEnvelope<FacilityResponse>>(`/api/v1/facilities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, linkGoogleMap }),
  });
  return unwrapApiData(raw);
}

export async function getMyFacilities(): Promise<FacilityResponse[]> {
  const raw = await customFetch<ApiResponseEnvelope<FacilityResponse[]>>(`/api/v1/facilities/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  });
  return unwrapApiData(raw);
}

export async function uploadFacilityMainImage(id: string, imageUrl: string): Promise<void> {
  await customFetch<ApiResponseEnvelope<null>>(`/api/v1/facilities/${id}/main-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl }),
  });
}
