import { getWardsByLonLat } from "@/api/location";
import { approximateCoordsFromIp } from "@/lib/ip-geolocation";

const STORAGE_KEY = "secondlife.visitorLocation";

export type VisitorLocationPayload = {
  provinceCode: string | null;
  wardCode: string | null;
  latitude: number;
  longitude: number;
  source: "ip";
};

export function loadVisitorLocation(): VisitorLocationPayload | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<VisitorLocationPayload>;
    const lat = Number(parsed.latitude);
    const lon = Number(parsed.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return {
      provinceCode: parsed.provinceCode?.trim() || null,
      wardCode: parsed.wardCode?.trim() || null,
      latitude: lat,
      longitude: lon,
      source: "ip",
    };
  } catch {
    return null;
  }
}

export function persistVisitorLocation(payload: VisitorLocationPayload): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota / privacy mode */
  }
}

/** Resolves approximate visitor location from IP and persists it. Returns true when stored. */
export async function resolveVisitorLocationFromIp(): Promise<boolean> {
  const coords = await approximateCoordsFromIp();
  if (!coords) return false;
  try {
    const wards = await getWardsByLonLat(coords.longitude, coords.latitude);
    const first = wards[0];
    persistVisitorLocation({
      latitude: coords.latitude,
      longitude: coords.longitude,
      provinceCode: first?.province?.code?.trim() ?? null,
      wardCode: first?.code?.trim() ?? null,
      source: "ip",
    });
    return true;
  } catch {
    return false;
  }
}
