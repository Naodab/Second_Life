export const MANAGE_BASE = "/manage";

export type ManageRouteParsed =
  | { tag: "products" }
  | { tag: "listings" }
  | { tag: "add-listing" }
  | { tag: "orders" }
  | { tag: "facility"; facilityId: string }
  | { tag: "add-product"; facilityId: string }
  | { tag: "product"; facilityId: string; productId: string }
  | { tag: "unpublished"; facilityId: string };

/** @deprecated Use {@link manageProductsPath} — dashboard route removed. */
export function manageDashboardPath(): string {
  return manageProductsPath();
}

export function manageFacilityPath(facilityId: string): string {
  return `${MANAGE_BASE}/facilities/${encodeURIComponent(facilityId)}`;
}

export function manageProductsPath(): string {
  return `${MANAGE_BASE}/products`;
}

export function manageListingsPath(): string {
  return `${MANAGE_BASE}/listings`;
}

export function manageAddProductPath(facilityId: string): string {
  return `${manageFacilityPath(facilityId)}/add-product`;
}

export function manageAddListingPath(facilityId?: string, productId?: string): string {
  const params = new URLSearchParams();
  if (facilityId?.trim()) params.set("facilityId", facilityId.trim());
  if (productId?.trim()) params.set("productId", productId.trim());
  const qs = params.toString();
  return `${MANAGE_BASE}/add-listing${qs ? `?${qs}` : ""}`;
}

export function manageProductDetailPath(facilityId: string, productId: string): string {
  return `${manageFacilityPath(facilityId)}/products/${encodeURIComponent(productId)}`;
}

export function manageUnpublishedPath(facilityId: string): string {
  return `${manageFacilityPath(facilityId)}/unpublished`;
}

export function manageOrdersPath(): string {
  return `${MANAGE_BASE}/orders`;
}

export function parseManageRoute(pathname: string): ManageRouteParsed | null {
  const pathOnly = pathname.split("?")[0] ?? pathname;
  if (!pathOnly.startsWith(MANAGE_BASE)) {
    return null;
  }
  const segments = pathOnly.split("/").filter(Boolean);
  if (segments.length < 2 || segments[0] !== "manage") {
    return null;
  }

  const second = segments[1];

  if (second === "products") {
    return segments.length === 2 ? { tag: "products" } : null;
  }
  if (second === "listings") {
    return segments.length === 2 ? { tag: "listings" } : null;
  }
  if (second === "add-listing") {
    return segments.length === 2 ? { tag: "add-listing" } : null;
  }
  if (second === "orders") {
    return segments.length === 2 ? { tag: "orders" } : null;
  }

  if (second !== "facilities") {
    return null;
  }

  const facilityId = segments[2];
  if (!facilityId) {
    return null;
  }

  if (segments.length === 3) {
    return { tag: "facility", facilityId };
  }

  const fourth = segments[3];

  switch (fourth) {
    case "add-product":
      return segments.length === 4 ? { tag: "add-product", facilityId } : null;
    case "add-listing":
      return null;
    case "unpublished":
      return segments.length === 4 ? { tag: "unpublished", facilityId } : null;
    case "products": {
      const productId = segments[4];
      return segments.length === 5 && productId ? { tag: "product", facilityId, productId } : null;
    }
    default:
      return null;
  }
}

export function facilityScopeActive(route: ManageRouteParsed, facilityId: string): boolean {
  if (
    route.tag === "products" ||
    route.tag === "listings" ||
    route.tag === "add-listing" ||
    route.tag === "orders"
  ) {
    return false;
  }

  return route.facilityId === facilityId;
}
