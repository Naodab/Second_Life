import type { ListingStatus } from "@/api/listing";
import type { ProductStatus } from "@/api/product";

export const ADMIN_LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  ACTIVE: "Đang đăng",
  INACTIVE: "Tạm ẩn",
  PENDING: "Chờ duyệt",
  REJECTED: "Từ chối",
};

export const ADMIN_PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: "Nháp",
  PUBLISHED: "Đã xuất bản",
  ARCHIVED: "Lưu trữ",
};

export function formatAdminPrice(
  min: number | null | undefined,
  max: number | null | undefined,
): string {
  if (min == null && max == null) return "—";
  const fmt = (n: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(n);
  if (min != null && max != null && min !== max) return `${fmt(min)} – ${fmt(max)}`;
  if (min != null) return fmt(min);
  if (max != null) return fmt(max);
  return "—";
}

export function listingStatusBadgeVariant(
  s: ListingStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (s) {
    case "ACTIVE":
      return "default";
    case "REJECTED":
      return "destructive";
    default:
      return "secondary";
  }
}

export function productStatusBadgeVariant(
  s: ProductStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (s) {
    case "PUBLISHED":
      return "default";
    case "ARCHIVED":
      return "destructive";
    default:
      return "secondary";
  }
}
