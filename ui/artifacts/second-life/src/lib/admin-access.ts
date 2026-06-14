import { ADMIN_HOME } from "@/lib/admin-paths";
import { sanitizeReturnTo } from "@/hooks/use-require-auth";

const ADMIN_READONLY_BLOCKED_PREFIXES = [
  "/manage",
  "/listings",
  "/cart",
  "/checkout",
  "/orders",
  "/messages",
] as const;

export function isAdminMarketplaceRestrictedPath(path: string): boolean {
  const normalized = sanitizeReturnTo(path.split("#")[0]?.split("?")[0] ?? path);
  return ADMIN_READONLY_BLOCKED_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}

export function resolveAdminSafePath(path: string | null | undefined, isAdmin: boolean): string {
  const safe = sanitizeReturnTo(path);
  if (!isAdmin) {
    return safe;
  }
  if (safe.startsWith("/admin")) {
    return safe;
  }
  if (isAdminMarketplaceRestrictedPath(safe)) {
    return safe.startsWith("/manage") || safe.startsWith("/listings") ? ADMIN_HOME : "/search";
  }
  return safe;
}

export function adminRedirectForRestrictedPath(path: string): string {
  const safe = sanitizeReturnTo(path.split("#")[0]?.split("?")[0] ?? path);
  if (safe.startsWith("/manage") || safe.startsWith("/listings")) {
    return ADMIN_HOME;
  }
  return "/search";
}

export function canUseMarketplaceActions(isAdmin: boolean): boolean {
  return !isAdmin;
}
