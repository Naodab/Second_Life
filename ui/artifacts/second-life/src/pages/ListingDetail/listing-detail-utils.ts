import type { CategoryResponse } from "@/api/categories";
import type { AttributeDto, ListingPublicDetailResponse } from "@/api/listing";
import { formatCurrency } from "@/lib/utils";
import { PLACEHOLDER_IMAGE } from "./constants";

export function findParentCategoryId(categories: CategoryResponse[], subCategoryId: string | null): string | null {
  if (!subCategoryId?.trim()) return null;
  const sid = subCategoryId.trim();
  for (const cat of categories) {
    if (cat.items?.some((s) => s.id === sid)) return cat.id;
  }
  return null;
}

export function collectImageUrls(detail: ListingPublicDetailResponse): string[] {
  const medias = detail.product.medias ?? [];
  const sorted = [...medias].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const urls = sorted
    .filter((m) => (m.mediaType ?? "IMAGE").toUpperCase() === "IMAGE" && m.mediaUrl?.trim())
    .map((m) => m.mediaUrl!.trim());
  const thumb = detail.product.thumbnailUrl?.trim();
  if (urls.length === 0 && thumb) return [thumb];
  return urls.length > 0 ? urls : [PLACEHOLDER_IMAGE];
}

export function mergeVariantRows(detail: ListingPublicDetailResponse) {
  const variantById = new Map((detail.product.variants ?? []).map((v) => [v.id, v]));
  return (detail.listing.variants ?? [])
    .filter((lv) => lv.isActive !== false)
    .map((lv) => {
      const pv = variantById.get(lv.productVariantId);
      return { lv, pv };
    });
}

export function attributesWithDistinctValues(attributes: AttributeDto[] | undefined | null): AttributeDto[] {
  if (!attributes?.length) return [];
  return attributes.filter((a) => {
    const vals = (a.attributeValues ?? []).filter((v) => (v.value ?? "").trim().length > 0);
    return vals.length > 0;
  });
}

export function priceBandLabel(min: number | null | undefined, max: number | null | undefined): string | null {
  if (min != null && max != null) {
    return min === max ? formatCurrency(min) : `${formatCurrency(min)} – ${formatCurrency(max)}`;
  }
  if (min != null) return formatCurrency(min);
  if (max != null) return formatCurrency(max);
  return null;
}
