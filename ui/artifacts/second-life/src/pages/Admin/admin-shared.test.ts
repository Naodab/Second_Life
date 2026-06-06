import { describe, expect, it } from "vitest";

import {
  ADMIN_LISTING_STATUS_LABELS,
  ADMIN_PRODUCT_STATUS_LABELS,
  formatAdminPrice,
  listingStatusBadgeVariant,
  productStatusBadgeVariant,
} from "./admin-shared";

describe("admin-shared", () => {
  describe("formatAdminPrice", () => {
    it("formats single and ranged prices in VND", () => {
      expect(formatAdminPrice(100_000, 100_000)).toMatch(/100\.?000/);
      expect(formatAdminPrice(50_000, 120_000)).toContain("–");
      expect(formatAdminPrice(null, null)).toBe("—");
    });
  });

  describe("status labels", () => {
    it("maps listing statuses to Vietnamese labels", () => {
      expect(ADMIN_LISTING_STATUS_LABELS.PENDING).toBe("Chờ duyệt");
      expect(ADMIN_LISTING_STATUS_LABELS.ACTIVE).toBe("Đang đăng");
    });

    it("maps product statuses to Vietnamese labels", () => {
      expect(ADMIN_PRODUCT_STATUS_LABELS.DRAFT).toBe("Nháp");
      expect(ADMIN_PRODUCT_STATUS_LABELS.PUBLISHED).toBe("Đã xuất bản");
    });
  });

  describe("badge variants", () => {
    it("uses semantic variants for listing statuses", () => {
      expect(listingStatusBadgeVariant("ACTIVE")).toBe("default");
      expect(listingStatusBadgeVariant("REJECTED")).toBe("destructive");
      expect(listingStatusBadgeVariant("PENDING")).toBe("secondary");
    });

    it("uses semantic variants for product statuses", () => {
      expect(productStatusBadgeVariant("PUBLISHED")).toBe("default");
      expect(productStatusBadgeVariant("ARCHIVED")).toBe("destructive");
      expect(productStatusBadgeVariant("DRAFT")).toBe("secondary");
    });
  });
});
