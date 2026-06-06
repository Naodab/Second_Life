import { describe, expect, it } from "vitest";

import { ADMIN_HOME } from "@/lib/admin-paths";
import {
  adminRedirectForRestrictedPath,
  canUseMarketplaceActions,
  isAdminMarketplaceRestrictedPath,
  resolveAdminSafePath,
} from "./admin-access";

describe("admin-access", () => {
  describe("isAdminMarketplaceRestrictedPath", () => {
    it("blocks seller hub and buyer flows", () => {
      expect(isAdminMarketplaceRestrictedPath("/manage/products")).toBe(true);
      expect(isAdminMarketplaceRestrictedPath("/cart")).toBe(true);
      expect(isAdminMarketplaceRestrictedPath("/checkout")).toBe(true);
      expect(isAdminMarketplaceRestrictedPath("/orders")).toBe(true);
      expect(isAdminMarketplaceRestrictedPath("/messages")).toBe(true);
    });

    it("allows browse and admin paths", () => {
      expect(isAdminMarketplaceRestrictedPath("/search")).toBe(false);
      expect(isAdminMarketplaceRestrictedPath("/listing/abc")).toBe(false);
      expect(isAdminMarketplaceRestrictedPath("/admin/listings/pending")).toBe(false);
    });
  });

  describe("resolveAdminSafePath", () => {
    it("passes through for regular users", () => {
      expect(resolveAdminSafePath("/cart", false)).toBe("/cart");
    });

    it("rewrites restricted paths for admin", () => {
      expect(resolveAdminSafePath("/manage/products", true)).toBe(ADMIN_HOME);
      expect(resolveAdminSafePath("/cart", true)).toBe("/search");
      expect(resolveAdminSafePath("/messages?tab=customers", true)).toBe("/search");
    });

    it("keeps admin panel and browse paths", () => {
      expect(resolveAdminSafePath("/admin/users", true)).toBe("/admin/users");
      expect(resolveAdminSafePath("/listing/x", true)).toBe("/listing/x");
    });
  });

  describe("adminRedirectForRestrictedPath", () => {
    it("sends manage to admin home and buyer flows to search", () => {
      expect(adminRedirectForRestrictedPath("/manage/listings")).toBe(ADMIN_HOME);
      expect(adminRedirectForRestrictedPath("/orders")).toBe("/search");
    });
  });

  describe("canUseMarketplaceActions", () => {
    it("returns false for admin", () => {
      expect(canUseMarketplaceActions(true)).toBe(false);
      expect(canUseMarketplaceActions(false)).toBe(true);
    });
  });
});
