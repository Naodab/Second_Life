import { customFetch } from "@workspace/api-client-react";
import { unwrapApiData, type ApiResponseEnvelope } from "./types";
import type { Shop } from "@/lib/mock-data";

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
  latitude?: number | null;
  longitude?: number | null;
  viewCount?: number | null;
  orderCount?: number | null;
  averageRating?: number | null;
};

const DEFAULT_FACILITY_AVATAR =
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop";

export function facilityResponseToShop(
  f: FacilityResponse,
  opts: { provinceLabel: string; wardLabel: string },
): Shop {
  return {
    id: f.id,
    name: f.name,
    avatar: f.imageUrl?.trim() || DEFAULT_FACILITY_AVATAR,
    address: f.address,
    province: opts.provinceLabel,
    ward: opts.wardLabel,
    rating: f.averageRating ?? 0,
    totalOrders: Number(f.orderCount ?? 0),
    joinedDate: new Date().toISOString().slice(0, 10),
    isVerified: false,
    categories: [],
  };
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
