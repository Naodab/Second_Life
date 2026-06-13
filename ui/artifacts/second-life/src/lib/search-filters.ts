import type { ListingSearchSort } from "@/api/listing";
import { buildFreshSearchPath, searchPathsQueryEqual } from "@/lib/search-url";
import { rawQueryFromBrowserSearch } from "@/lib/wouter-location";

export type SearchListingTypeFilter = "all" | "buy" | "rent";

export type SearchFilters = {
  listingType: SearchListingTypeFilter;
  categoryId?: string;
  subCategoryId?: string;
  provinceCode?: string;
  wardCode?: string;
  keyword: string;
  sortBy: ListingSearchSort;
  priceMin?: number;
  priceMax?: number;
};

export const DEFAULT_SEARCH_SORT: ListingSearchSort = "UPDATED_AT_DESC";

function trimParam(raw: string | null | undefined): string | undefined {
  const t = raw?.trim();
  return t ? t : undefined;
}

function readFirstSearchParam(searchParams: URLSearchParams, baseKey: string): string | undefined {
  const values = [...searchParams.getAll(`${baseKey}[]`), ...searchParams.getAll(baseKey)].filter(Boolean);
  for (const v of values) {
    const t = String(v).trim();
    if (t) return t;
  }
  const legacyKey = baseKey.endsWith("Ids") ? `${baseKey.slice(0, -3)}Id` : null;
  if (legacyKey) {
    const legacy = searchParams.get(legacyKey)?.trim();
    if (legacy) return legacy;
  }
  return undefined;
}

function listingTypeFromSearchParams(searchParams: URLSearchParams): SearchListingTypeFilter {
  const raw = searchParams.get("listingType") ?? searchParams.get("type");
  if (!raw) return "all";
  const t = raw.trim().toLowerCase();
  if (t === "buy" || t === "rent") return t;
  const u = raw.trim().toUpperCase();
  if (u === "BUY") return "buy";
  if (u === "RENT") return "rent";
  return "all";
}

function parseSortParam(raw: string | null): ListingSearchSort {
  const allowed = new Set<ListingSearchSort>([
    "UPDATED_AT_DESC",
    "CREATED_AT_DESC",
    "RELEVANCE",
    "DISTANCE",
  ]);
  if (raw === "NAME_ASC") return DEFAULT_SEARCH_SORT;
  if (raw && allowed.has(raw as ListingSearchSort)) return raw as ListingSearchSort;
  return DEFAULT_SEARCH_SORT;
}

export function parseCommaNumber(raw: string): number | undefined {
  const t = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

export function parseSearchFilters(search: string): SearchFilters {
  const searchParams = new URLSearchParams(rawQueryFromBrowserSearch(search) || "");
  const subCategoryId = readFirstSearchParam(searchParams, "subCategoryIds");
  const categoryId = subCategoryId
    ? undefined
    : readFirstSearchParam(searchParams, "categoryIds");

  return {
    listingType: listingTypeFromSearchParams(searchParams),
    categoryId,
    subCategoryId,
    provinceCode:
      trimParam(searchParams.get("provinceCode")) ??
      trimParam(searchParams.get("province")),
    wardCode:
      trimParam(searchParams.get("WardCode")) ??
      trimParam(searchParams.get("wardCode")) ??
      trimParam(searchParams.get("ward")),
    keyword: (searchParams.get("keyword") || searchParams.get("q") || "").trim(),
    sortBy: parseSortParam(searchParams.get("sortBy")),
    priceMin: parseCommaNumber(searchParams.get("priceMin") ?? "") ?? undefined,
    priceMax: parseCommaNumber(searchParams.get("priceMax") ?? "") ?? undefined,
  };
}

export function priceInputFromFilter(value: number | undefined): string {
  return value != null ? String(value) : "";
}

export function searchFiltersEqual(a: SearchFilters, b: SearchFilters): boolean {
  return (
    a.listingType === b.listingType &&
    (a.categoryId ?? "") === (b.categoryId ?? "") &&
    (a.subCategoryId ?? "") === (b.subCategoryId ?? "") &&
    (a.provinceCode ?? "") === (b.provinceCode ?? "") &&
    (a.wardCode ?? "") === (b.wardCode ?? "") &&
    a.keyword === b.keyword &&
    a.sortBy === b.sortBy &&
    (a.priceMin ?? null) === (b.priceMin ?? null) &&
    (a.priceMax ?? null) === (b.priceMax ?? null)
  );
}

export function filtersFromSidebarState(input: {
  typeFilter: SearchListingTypeFilter;
  categoryId?: string;
  subCategoryId?: string;
  provinceCode?: string;
  wardCode?: string;
  keyword: string;
  sortBy: ListingSearchSort;
  priceMinNum?: number;
  priceMaxNum?: number;
}): SearchFilters {
  return {
    listingType: input.typeFilter,
    categoryId: input.categoryId,
    subCategoryId: input.subCategoryId,
    provinceCode: input.provinceCode,
    wardCode: input.wardCode,
    keyword: input.keyword.trim(),
    sortBy: input.sortBy,
    priceMin: input.priceMinNum,
    priceMax: input.priceMaxNum,
  };
}

export function buildSearchFiltersPath(filters: SearchFilters): string {
  return buildFreshSearchPath({
    keyword: filters.keyword ? filters.keyword : null,
    q: null,
    sortBy: filters.sortBy !== DEFAULT_SEARCH_SORT ? filters.sortBy : null,
    listingType: filters.listingType === "all" ? null : filters.listingType,
    type: null,
    categoryId: filters.categoryId ?? null,
    subCategoryId: filters.subCategoryId ?? null,
    provinceCode: filters.provinceCode ?? null,
    wardCode: filters.wardCode ?? null,
    priceMin: filters.priceMin != null ? String(filters.priceMin) : null,
    priceMax: filters.priceMax != null ? String(filters.priceMax) : null,
  });
}

export function searchQueryMatchesPath(search: string, path: string): boolean {
  const stub = (() => {
    const q = rawQueryFromBrowserSearch(search);
    return q ? `/search?${q}` : "/search";
  })();
  return searchPathsQueryEqual(path, stub);
}
