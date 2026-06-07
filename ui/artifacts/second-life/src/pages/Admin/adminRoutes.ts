import { ADMIN_BASE } from "@/lib/admin-paths";

export type AdminRouteParsed =
  | { tag: "listings-pending" }
  | { tag: "listings" }
  | { tag: "facilities" }
  | { tag: "products" }
  | { tag: "users" }
  | { tag: "orders" }
  | { tag: "messages" };

export function adminListingsPendingPath(): string {
  return `${ADMIN_BASE}/listings/pending`;
}

export function adminListingsPath(): string {
  return `${ADMIN_BASE}/listings`;
}

export function adminFacilitiesPath(): string {
  return `${ADMIN_BASE}/facilities`;
}

export function adminProductsPath(): string {
  return `${ADMIN_BASE}/products`;
}

export function adminUsersPath(): string {
  return `${ADMIN_BASE}/users`;
}

export function adminOrdersPath(): string {
  return `${ADMIN_BASE}/orders`;
}

export function adminMessagesPath(): string {
  return `${ADMIN_BASE}/messages`;
}

export function parseAdminRoute(pathname: string): AdminRouteParsed | null {
  const pathOnly = pathname.split("?")[0] ?? pathname;
  if (!pathOnly.startsWith(ADMIN_BASE)) {
    return null;
  }
  const segments = pathOnly.split("/").filter(Boolean);
  if (segments.length < 2 || segments[0] !== "admin") {
    return null;
  }

  const second = segments[1];
  if (second === "listings") {
    if (segments.length === 3 && segments[2] === "pending") {
      return { tag: "listings-pending" };
    }
    if (segments.length === 2) {
      return { tag: "listings" };
    }
    return null;
  }
  if (second === "facilities" && segments.length === 2) {
    return { tag: "facilities" };
  }
  if (second === "products" && segments.length === 2) {
    return { tag: "products" };
  }
  if (second === "users" && segments.length === 2) {
    return { tag: "users" };
  }
  if (second === "orders" && segments.length === 2) {
    return { tag: "orders" };
  }
  if (second === "messages" && segments.length === 2) {
    return { tag: "messages" };
  }
  return null;
}

export function adminRouteActive(route: AdminRouteParsed | null, tag: AdminRouteParsed["tag"]): boolean {
  return route?.tag === tag;
}
