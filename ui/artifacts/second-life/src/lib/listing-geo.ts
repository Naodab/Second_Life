import type { VisitorLocationPayload } from "@/lib/visitor-location";

export const LISTING_GEO_RADIUS_METERS = 50_000;

export type ListingGeoParams = {
  latitude: number;
  longitude: number;
  radiusMeters: number;
};

export function listingGeoParamsFromVisitor(
  location: VisitorLocationPayload | null | undefined,
): Partial<ListingGeoParams> {
  if (!location) return {};
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    radiusMeters: LISTING_GEO_RADIUS_METERS,
  };
}

export function hasVisitorGeo(location: VisitorLocationPayload | null | undefined): boolean {
  return (
    location != null &&
    Number.isFinite(location.latitude) &&
    Number.isFinite(location.longitude)
  );
}
