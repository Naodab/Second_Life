import type { FacilityResponse } from "@/api/facility";

const COORDINATES_IN_URL = /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/;
const EMBED_ZOOM = 17;

export type FacilityMapSource = Pick<
  FacilityResponse,
  "linkGoogleMap" | "latitude" | "longitude" | "address"
> & {
  searchAddress?: string;
};

function isValidCoordinate(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return false;
  }
  if (lat === 0 && lng === 0) {
    return false;
  }
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

function buildEmbedUrl(query: string, lat?: number, lng?: number): string {
  const url = new URL("https://www.google.com/maps");
  url.searchParams.set("q", query);
  url.searchParams.set("hl", "vi");
  url.searchParams.set("z", String(EMBED_ZOOM));
  url.searchParams.set("output", "embed");
  if (lat != null && lng != null && isValidCoordinate(lat, lng)) {
    url.searchParams.set("ll", `${lat},${lng}`);
  }
  return url.toString();
}

function extractQueryFromLink(link: string): string | null {
  try {
    const url = new URL(link);
    const q = url.searchParams.get("q")?.trim();
    if (q) {
      return q;
    }
  } catch {
  }

  const match = link.match(COORDINATES_IN_URL);
  if (match) {
    return `${match[1]},${match[2]}`;
  }

  return null;
}

export function buildGoogleMapsEmbedUrl(facility: FacilityMapSource): string | null {
  const link = facility.linkGoogleMap?.trim();
  const linkQuery = link ? extractQueryFromLink(link) : null;
  const searchAddress = facility.searchAddress?.trim() || facility.address?.trim() || null;

  const lat = facility.latitude;
  const lng = facility.longitude;
  const hasCoords = lat != null && lng != null && isValidCoordinate(lat, lng);

  const placeQuery = linkQuery || searchAddress;
  if (placeQuery) {
    return buildEmbedUrl(placeQuery, hasCoords ? lat : undefined, hasCoords ? lng : undefined);
  }

  if (hasCoords) {
    return buildEmbedUrl(`${lat},${lng}`, lat, lng);
  }

  return null;
}

export function buildGoogleMapsOpenUrl(facility: FacilityMapSource): string | null {
  const link = facility.linkGoogleMap?.trim();
  if (link) {
    return link;
  }

  const searchAddress = facility.searchAddress?.trim() || facility.address?.trim();
  if (searchAddress) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchAddress)}`;
  }

  const lat = facility.latitude;
  const lng = facility.longitude;
  if (lat != null && lng != null && isValidCoordinate(lat, lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  return null;
}

export function facilityHasMap(facility: FacilityMapSource): boolean {
  return buildGoogleMapsEmbedUrl(facility) != null;
}
