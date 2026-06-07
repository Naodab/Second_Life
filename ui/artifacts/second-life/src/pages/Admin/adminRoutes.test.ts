import { describe, expect, it } from "vitest";

import { ADMIN_BASE } from "@/lib/admin-paths";
import {
  adminFacilitiesPath,
  adminListingsPath,
  adminListingsPendingPath,
  adminMessagesPath,
  adminOrdersPath,
  adminProductsPath,
  adminRouteActive,
  adminUsersPath,
  parseAdminRoute,
} from "./adminRoutes";

describe("adminRoutes", () => {
  it("builds stable admin paths", () => {
    expect(adminListingsPendingPath()).toBe(`${ADMIN_BASE}/listings/pending`);
    expect(adminListingsPath()).toBe(`${ADMIN_BASE}/listings`);
    expect(adminFacilitiesPath()).toBe(`${ADMIN_BASE}/facilities`);
    expect(adminProductsPath()).toBe(`${ADMIN_BASE}/products`);
    expect(adminUsersPath()).toBe(`${ADMIN_BASE}/users`);
    expect(adminOrdersPath()).toBe(`${ADMIN_BASE}/orders`);
    expect(adminMessagesPath()).toBe(`${ADMIN_BASE}/messages`);
  });

  it("parses known admin routes", () => {
    expect(parseAdminRoute("/admin/listings/pending")).toEqual({ tag: "listings-pending" });
    expect(parseAdminRoute("/admin/listings")).toEqual({ tag: "listings" });
    expect(parseAdminRoute("/admin/facilities")).toEqual({ tag: "facilities" });
    expect(parseAdminRoute("/admin/products")).toEqual({ tag: "products" });
    expect(parseAdminRoute("/admin/users")).toEqual({ tag: "users" });
    expect(parseAdminRoute("/admin/orders")).toEqual({ tag: "orders" });
    expect(parseAdminRoute("/admin/messages")).toEqual({ tag: "messages" });
  });

  it("ignores query string when parsing", () => {
    expect(parseAdminRoute("/admin/listings?page=2")).toEqual({ tag: "listings" });
  });

  it("returns null for unknown or invalid admin paths", () => {
    expect(parseAdminRoute("/manage/products")).toBeNull();
    expect(parseAdminRoute("/admin")).toBeNull();
    expect(parseAdminRoute("/admin/listings/pending/extra")).toBeNull();
    expect(parseAdminRoute("/admin/unknown")).toBeNull();
  });

  it("checks active route by tag", () => {
    const route = parseAdminRoute("/admin/products");
    expect(adminRouteActive(route, "products")).toBe(true);
    expect(adminRouteActive(route, "facilities")).toBe(false);
    expect(adminRouteActive(null, "products")).toBe(false);
  });
});
