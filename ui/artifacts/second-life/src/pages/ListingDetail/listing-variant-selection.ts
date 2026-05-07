import type {
  AttributeDto,
  ListingPublicDetailResponse,
  ListingVariantResponse,
  ProductVariantSummaryDto,
} from "@/api/listing";
import { attributesWithDistinctValues, mergeVariantRows } from "./listing-detail-utils";

export function attributeAxisKey(attr: AttributeDto): string {
  const k = (attr.id ?? attr.name ?? "").trim();
  return k || "__attr";
}

export function buildListingVariantAxes(detail: ListingPublicDetailResponse): AttributeDto[] {
  const rows = mergeVariantRows(detail);
  const listed = new Set<string>();
  for (const { pv } of rows) {
    for (const raw of pv?.attributeValueIds ?? []) {
      const id = raw?.trim();
      if (id) listed.add(id);
    }
  }
  if (listed.size === 0) return [];

  const base = attributesWithDistinctValues(detail.product.attributes);
  return base
    .map((attr) => ({
      ...attr,
      attributeValues: (attr.attributeValues ?? []).filter((v) => {
        const vid = v.id?.trim();
        return Boolean(vid && listed.has(vid));
      }),
    }))
    .filter((a) => (a.attributeValues?.length ?? 0) > 0);
}

function setsEqualString(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

export function findRowMatchingSelection(
  detail: ListingPublicDetailResponse,
  axes: AttributeDto[],
  selection: Record<string, string>,
): { lv: ListingVariantResponse; pv: ProductVariantSummaryDto } | null {
  const picked: string[] = [];
  for (const ax of axes) {
    const key = attributeAxisKey(ax);
    const vid = selection[key]?.trim();
    if (!vid) return null;
    picked.push(vid);
  }
  if (picked.length !== axes.length) return null;

  const wanted = new Set(picked);
  const rows = mergeVariantRows(detail);
  for (const { lv, pv } of rows) {
    if (!pv) continue;
    const ids = (pv.attributeValueIds ?? []).map((x) => String(x).trim()).filter(Boolean);
    if (ids.length === 0) continue;
    if (setsEqualString(new Set(ids), wanted)) return { lv, pv };
  }
  return null;
}

export function defaultVariantSelection(
  detail: ListingPublicDetailResponse,
  axes: AttributeDto[],
): Record<string, string> {
  if (axes.length === 0) return {};
  const rows = mergeVariantRows(detail);
  for (const { pv } of rows) {
    if (!pv?.attributeValueIds?.length) continue;
    const idset = new Set(pv.attributeValueIds.map((x) => String(x).trim()).filter(Boolean));
    if (idset.size !== axes.length) continue;
    const sel: Record<string, string> = {};
    let ok = true;
    for (const ax of axes) {
      const match = (ax.attributeValues ?? []).find((v) => v.id && idset.has(String(v.id).trim()));
      const id = match?.id?.trim();
      if (!id) {
        ok = false;
        break;
      }
      sel[attributeAxisKey(ax)] = id;
    }
    if (ok) return sel;
  }
  return {};
}

export function lineBuyUnitPrice(detail: ListingPublicDetailResponse, lv: ListingVariantResponse): number {
  const p = lv.buyPrice;
  if (typeof p === "number" && Number.isFinite(p) && p > 0) return p;
  const m = detail.listing.minPrice;
  return typeof m === "number" && Number.isFinite(m) && m > 0 ? m : 0;
}

export function lineRentUnitPrice(detail: ListingPublicDetailResponse, lv: ListingVariantResponse): number {
  const p = lv.rentPrice;
  if (typeof p === "number" && Number.isFinite(p) && p > 0) return p;
  const m = detail.listing.minPrice;
  return typeof m === "number" && Number.isFinite(m) && m > 0 ? m : 0;
}

export function productVariantStock(variant: { quantity?: number | null } | null | undefined): number {
  const q = variant?.quantity;
  if (typeof q !== "number" || !Number.isFinite(q)) return 0;
  return Math.max(0, Math.floor(q));
}
