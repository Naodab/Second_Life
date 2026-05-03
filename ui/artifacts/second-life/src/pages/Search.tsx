import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useSearch } from "wouter";
import { Filter, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListingCard } from "@/components/ListingCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { getProvinces, ProvinceResponse, getWards, WardResponse } from "@/api/location";
import {
  searchListings,
  type ListingItemResponse,
  type ListingSearchSort,
} from "@/api/listing";
import { LocationPickerCombobox } from "@/components/LocationPickerCombobox";
import { useCategories } from "@/hooks/use-categories";
import type { CategoryResponse } from "@/api/categories";
import { buildFreshSearchPath, searchPathsQueryEqual } from "@/lib/search-url";
import { pathStubForSearchQueryCompare, rawQueryFromBrowserSearch } from "@/lib/wouter-location";

const DEFAULT_SORT: ListingSearchSort = "UPDATED_AT_DESC";

const SORT_VALUES_IN_SELECT = new Set<ListingSearchSort>([
  "UPDATED_AT_DESC",
  "CREATED_AT_DESC",
  "NAME_ASC",
  "RELEVANCE",
  "DISTANCE",
]);

const EMPTY_WARD_LIST: WardResponse[] = [];

function readArrayParam(searchParams: URLSearchParams, key: string): string[] {
  const values = [...searchParams.getAll(`${key}[]`), ...searchParams.getAll(key)].filter(Boolean);
  return Array.from(new Set(values.map(String)));
}

function mergeSingularParam(ids: string[], singular: string | null): string[] {
  const v = singular?.trim();
  if (!v) return ids;
  return Array.from(new Set([...ids, v]));
}

function shallowStringArrayEq(a: string[], b: string[]): boolean {
  return (
    a === b || (a.length === b.length && a.every((v, i) => v === b[i]))
  );
}

function trimParam(raw: string | null | undefined): string | undefined {
  const t = raw?.trim();
  return t ? t : undefined;
}

function listingTypeFromSearchParams(searchParams: URLSearchParams): "all" | "buy" | "rent" {
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
    "NAME_ASC",
    "DISTANCE",
  ]);
  if (raw && allowed.has(raw as ListingSearchSort)) return raw as ListingSearchSort;
  return DEFAULT_SORT;
}

function parseCommaNumber(raw: string): number | undefined {
  const t = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

function filterCategoryIdsToKnown(ids: string[], categories: CategoryResponse[]): string[] {
  const knownCat = new Set(categories.map((c) => String(c.id)));
  return ids.filter((id) => knownCat.has(String(id)));
}

function filterSubCategoryIdsToKnown(ids: string[], categories: CategoryResponse[]): string[] {
  const knownSub = new Set(
    categories.flatMap((c) => (c.items ?? []).map((s) => String(s.id))),
  );
  return ids.filter((id) => knownSub.has(String(id)));
}

function provinceKnown(code: string | undefined, provinces: ProvinceResponse[]): boolean {
  if (!code?.trim()) return false;
  const n = code.trim();
  return provinces.some((x) => String(x.code ?? "").trim() === n);
}

function wardMatchesList(raw: string, wards: WardResponse[]): boolean {
  const n = raw.trim();
  if (!n) return false;
  return wards.some((w) => {
    const c = String(w.code ?? "").trim();
    const id = String(w.id ?? "").trim();
    return (c.length > 0 && c === n) || (id.length > 0 && id === n);
  });
}

export default function Search() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [provinces, setProvinces] = useState<ProvinceResponse[]>([]);
  const [wards, setWards] = useState<WardResponse[]>([]);
  const [hoverCategoryId, setHoverCategoryId] = useState<string | null>(null);
  const [submenuPos, setSubmenuPos] = useState<{ top: number; left: number } | null>(null);
  const hoverCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data: categories, isFetched: categoriesFetched } = useCategories();

  const [listings, setListings] = useState<ListingItemResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [provinceListReady, setProvinceListReady] = useState(false);
  const [wardsLoading, setWardsLoading] = useState(false);

  const refsReady = provinceListReady && categoriesFetched;

  const clearHoverCloseTimer = () => {
    if (hoverCloseTimerRef.current) {
      clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }
  };

  const openHoverMenu = (catId: string, anchorEl?: HTMLElement | null) => {
    clearHoverCloseTimer();
    setHoverCategoryId(catId);
    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      setSubmenuPos({
        top: rect.top,
        left: rect.right + 8,
      });
    }
  };

  const scheduleCloseHoverMenu = (catId: string) => {
    clearHoverCloseTimer();
    hoverCloseTimerRef.current = setTimeout(() => {
      setHoverCategoryId((prev) => {
        if (prev === catId) {
          setSubmenuPos(null);
          return null;
        }
        return prev;
      });
    }, 180);
  };

  const parsedFilters = useMemo(() => {
    const searchParams = new URLSearchParams(rawQueryFromBrowserSearch(search) || "");
    return {
      listingType: listingTypeFromSearchParams(searchParams),
      categoryIds: mergeSingularParam(
        readArrayParam(searchParams, "categoryIds"),
        searchParams.get("categoryId"),
      ),
      subCategoryIds: mergeSingularParam(
        readArrayParam(searchParams, "subCategoryIds"),
        searchParams.get("subCategoryId"),
      ),
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
  }, [search]);

  const [typeFilter, setTypeFilter] = useState<"all" | "buy" | "rent">(parsedFilters.listingType);
  const [categoryIds, setCategoryIds] = useState<string[]>(parsedFilters.categoryIds);
  const [subCategoryIds, setSubCategoryIds] = useState<string[]>(parsedFilters.subCategoryIds);
  const [provinceCode, setProvinceCode] = useState<string | undefined>(parsedFilters.provinceCode);
  const [wardCode, setWardCode] = useState<string | undefined>(parsedFilters.wardCode);
  const [keyword, setKeyword] = useState(parsedFilters.keyword);
  const [sortBy, setSortBy] = useState<ListingSearchSort>(parsedFilters.sortBy);
  const [priceMinInput, setPriceMinInput] = useState(
    parsedFilters.priceMin != null ? String(parsedFilters.priceMin) : "",
  );
  const [priceMaxInput, setPriceMaxInput] = useState(
    parsedFilters.priceMax != null ? String(parsedFilters.priceMax) : "",
  );

  useLayoutEffect(() => {
    const p = parsedFilters;
    setTypeFilter((prev) => (prev === p.listingType ? prev : p.listingType));
    setCategoryIds((prev) =>
      shallowStringArrayEq(prev, p.categoryIds) ? prev : p.categoryIds,
    );
    setSubCategoryIds((prev) =>
      shallowStringArrayEq(prev, p.subCategoryIds) ? prev : p.subCategoryIds,
    );
    setProvinceCode((prev) => (prev === p.provinceCode ? prev : p.provinceCode));
    setWardCode((prev) => (prev === p.wardCode ? prev : p.wardCode));
    setKeyword((prev) => (prev === p.keyword ? prev : p.keyword));
    setSortBy((prev) => (prev === p.sortBy ? prev : p.sortBy));
    const nextMin = p.priceMin != null ? String(p.priceMin) : "";
    const nextMax = p.priceMax != null ? String(p.priceMax) : "";
    setPriceMinInput((prev) => (prev === nextMin ? prev : nextMin));
    setPriceMaxInput((prev) => (prev === nextMax ? prev : nextMax));
  }, [parsedFilters]);

  useEffect(() => {
    let cancelled = false;
    getProvinces({})
      .then((rows) => {
        if (!cancelled) setProvinces(rows);
      })
      .catch(() => {
        if (!cancelled) setProvinces([]);
      })
      .finally(() => {
        if (!cancelled) setProvinceListReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!provinceCode) {
      setWards((prev) => (prev.length === 0 ? prev : EMPTY_WARD_LIST));
      setWardsLoading(false);
      return;
    }
    let cancelled = false;
    setWardsLoading(true);
    setWards(EMPTY_WARD_LIST);
    getWards({ provinceCode })
      .then((list) => {
        if (!cancelled) setWards(list);
      })
      .catch(() => {
        if (!cancelled) setWards([]);
      })
      .finally(() => {
        if (!cancelled) setWardsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [provinceCode]);

  useEffect(() => {
    if (!refsReady) return;
    if (provinces.length > 0) {
      setProvinceCode((prev) => (provinceKnown(prev, provinces) ? prev : undefined));
    }
    if (categories.length > 0) {
      setCategoryIds((prev) => {
        const next = filterCategoryIdsToKnown(prev, categories);
        return shallowStringArrayEq(prev, next) ? prev : next;
      });
      setSubCategoryIds((prev) => {
        const next = filterSubCategoryIdsToKnown(prev, categories);
        return shallowStringArrayEq(prev, next) ? prev : next;
      });
    }
  }, [refsReady, provinces, categories]);

  /* Không có tỉnh → xóa xã một lần; tách khỏi deps wards (tránh chạy lại khi list phường đổi). */
  useEffect(() => {
    if (!provinceCode) {
      setWardCode((prev) => (prev === undefined ? prev : undefined));
    }
  }, [provinceCode]);

  useEffect(() => {
    if (!provinceCode) return;
    if (wardsLoading) return;
    /*
     * Không prune khi chưa có danh sách phường (list rỗng): trước/sau fetch lỗi hoặc API trả [],
     * wards.some(...) sẽ xóa wardCode đúng từ URL — cùng nguyên tắc với provinces/categories.
     */
    if (wards.length === 0) return;
    setWardCode((prev) => {
      if (!prev?.trim()) return prev;
      return wardMatchesList(prev, wards) ? prev : undefined;
    });
  }, [provinceCode, wards, wardsLoading]);

  const priceMinNum = useMemo(() => parseCommaNumber(priceMinInput), [priceMinInput]);
  const priceMaxNum = useMemo(() => parseCommaNumber(priceMaxInput), [priceMaxInput]);

  const desiredSearchPath = useMemo(() => {
    if (!refsReady) return null;
    // Header navigates → URL updates before `keyword` state hydrates; trust parsed URL when mismatched briefly.
    const fromState = keyword.trim();
    const fromUrl = parsedFilters.keyword.trim();
    const keywordForPath = fromState === fromUrl ? fromState : fromUrl;

    return buildFreshSearchPath({
      keyword: keywordForPath ? keywordForPath : null,
      q: null,
      sortBy: sortBy !== DEFAULT_SORT ? sortBy : null,
      listingType: typeFilter === "all" ? null : typeFilter,
      type: null,
      "categoryIds[]": categoryIds.length > 0 ? categoryIds : null,
      "subCategoryIds[]": subCategoryIds.length > 0 ? subCategoryIds : null,
      provinceCode: provinceCode ?? null,
      WardCode: wardCode ?? null,
      priceMin: priceMinNum != null ? String(priceMinNum) : null,
      priceMax: priceMaxNum != null ? String(priceMaxNum) : null,
    });
  }, [
    refsReady,
    keyword,
    parsedFilters.keyword,
    sortBy,
    typeFilter,
    categoryIds,
    subCategoryIds,
    provinceCode,
    wardCode,
    priceMinNum,
    priceMaxNum,
  ]);

  useEffect(() => {
    if (!desiredSearchPath) return;
    if (!searchPathsQueryEqual(desiredSearchPath, pathStubForSearchQueryCompare(search))) {
      setLocation(desiredSearchPath);
    }
  }, [desiredSearchPath, search, setLocation]);

  const [debouncedKeyword, setDebouncedKeyword] = useState(keyword);
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedKeyword(keyword), 350);
    return () => clearTimeout(t);
  }, [keyword]);

  useEffect(() => {
    return () => {
      clearHoverCloseTimer();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const rows = await searchListings({
          keyword: debouncedKeyword.trim() || undefined,
          listingType: typeFilter === "all" ? null : typeFilter === "buy" ? "BUY" : "RENT",
          categoryIds: categoryIds.length > 0 ? categoryIds : null,
          subCategoryIds: subCategoryIds.length > 0 ? subCategoryIds : null,
          provinceCode: provinceCode ?? null,
          wardCode: wardCode ?? null,
          priceMin: priceMinNum ?? null,
          priceMax: priceMaxNum ?? null,
          sortBy,
          page: 0,
          pageSize: 60,
        });
        if (!cancelled) setListings(Array.isArray(rows) ? rows : []);
      } catch (e) {
        if (!cancelled) {
          setListings([]);
          setFetchError(e instanceof Error ? e.message : "Không tải được tin đăng.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    debouncedKeyword,
    typeFilter,
    categoryIds.join("\0"),
    subCategoryIds.join("\0"),
    provinceCode,
    wardCode,
    priceMinNum,
    priceMaxNum,
    sortBy,
  ]);

  const categoryNameMap = useMemo(
    () => new Map(categories.map((cat) => [String(cat.id), cat.name])),
    [categories],
  );

  const selectedCategoryText = useMemo(() => {
    if (categoryIds.length === 0) return "Tất cả sản phẩm";
    if (categoryIds.length === 1) return categoryNameMap.get(categoryIds[0]) || "Danh mục";
    return `${categoryIds.length} danh mục`;
  }, [categoryIds, categoryNameMap]);

  const toggleCategory = (id: string, checked: boolean) => {
    setCategoryIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((item) => item !== id);
    });
  };

  const toggleSubCategory = (id: string, checked: boolean) => {
    setSubCategoryIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((item) => item !== id);
    });
  };

  const resetFiltersPreserveKeyword = () => {
    setCategoryIds([]);
    setSubCategoryIds([]);
    setTypeFilter("all");
    setProvinceCode(undefined);
    setWardCode(undefined);
    setSortBy(DEFAULT_SORT);
    setPriceMinInput("");
    setPriceMaxInput("");
  };

  return (
    <div className="min-h-screen bg-muted/40 pt-8 pb-20 dark:bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile Filter Toggle */}
        <div className="flex md:hidden items-center justify-between mb-4">
          <h1 className="text-2xl font-bold font-display">Khám phá</h1>
          <Button variant="outline" size="sm" className="bg-card">
            <Filter className="w-4 h-4 mr-2" /> Bộ lọc
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <aside className="w-full md:w-64 flex-shrink-0 hidden md:block relative z-20">
            <div className="sticky top-28 relative z-20 max-h-[calc(100vh-8rem)] overflow-y-auto overflow-x-visible pr-1 custom-scrollbar">
              <div>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary" /> Bộ lọc
                </h3>

                <div className="space-y-6 overflow-visible rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wider">
                      Loại tin
                    </h4>
                    <Select
                      value={typeFilter === "all" ? "all" : typeFilter}
                      onValueChange={(v) => setTypeFilter(v === "all" ? "all" : (v as "buy" | "rent"))}
                    >
                      <SelectTrigger className="border-transparent bg-muted/60 dark:bg-card">
                        <SelectValue placeholder="Chọn loại tin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="buy">Chỉ mua</SelectItem>
                        <SelectItem value="rent">Chỉ thuê</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wider">
                      Địa điểm
                    </h4>
                    <LocationPickerCombobox
                      items={provinces}
                      value={provinceCode}
                      onValueChange={(code) => {
                        setProvinceCode(code);
                        setWardCode(undefined);
                      }}
                      allLabel="Tất cả tỉnh thành"
                      searchPlaceholder="Tìm tỉnh thành..."
                      emptySearchText="Không tìm thấy tỉnh thành."
                    />
                    <LocationPickerCombobox
                      className="mt-2"
                      items={wards}
                      value={wardCode}
                      onValueChange={setWardCode}
                      disabled={!provinceCode}
                      allLabel="Tất cả xã phường"
                      searchPlaceholder={provinceCode ? "Tìm xã, phường..." : "Chọn tỉnh thành trước"}
                      emptySearchText={provinceCode ? "Không tìm thấy xã phường." : "Chọn tỉnh thành trước."}
                    />
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wider">
                      Danh mục
                    </h4>
                    <div className="space-y-3 pr-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="cat-all"
                          checked={categoryIds.length === 0 && subCategoryIds.length === 0}
                          onCheckedChange={() => {
                            setCategoryIds([]);
                            setSubCategoryIds([]);
                          }}
                        />
                        <label htmlFor="cat-all" className="text-sm font-medium leading-none cursor-pointer">
                          Tất cả danh mục
                        </label>
                      </div>

                      {categories.map((cat) => {
                        const catId = String(cat.id);
                        const subItems = cat.items || [];
                        const hasSubCategories = subItems.length > 0;
                        return (
                          <div
                            key={catId}
                            className="relative"
                            onMouseEnter={(event) => openHoverMenu(catId, event.currentTarget)}
                            onMouseLeave={() => scheduleCloseHoverMenu(catId)}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center space-x-2 min-w-0">
                                <Checkbox
                                  id={`cat-${catId}`}
                                  checked={categoryIds.includes(catId)}
                                  onCheckedChange={(checked) => toggleCategory(catId, checked === true)}
                                />
                                <label
                                  htmlFor={`cat-${catId}`}
                                  className="text-sm leading-none cursor-pointer text-muted-foreground truncate"
                                >
                                  {cat.name}
                                </label>
                              </div>
                              {hasSubCategories && (
                                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              )}
                            </div>

                            {hasSubCategories &&
                              hoverCategoryId === catId &&
                              submenuPos &&
                              typeof document !== "undefined" &&
                              createPortal(
                                <div
                                  className="fixed z-[1400] min-w-56 space-y-2 rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-lg"
                                  style={{ top: submenuPos.top, left: submenuPos.left }}
                                  onMouseEnter={() => openHoverMenu(catId)}
                                  onMouseLeave={() => scheduleCloseHoverMenu(catId)}
                                >
                                  {subItems.map((sub) => {
                                    const subId = String(sub.id);
                                    return (
                                      <div key={subId} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`sub-${catId}-${subId}`}
                                          checked={subCategoryIds.includes(subId)}
                                          onCheckedChange={(checked) =>
                                            toggleSubCategory(subId, checked === true)
                                          }
                                        />
                                        <label
                                          htmlFor={`sub-${catId}-${subId}`}
                                          className="text-sm leading-none cursor-pointer text-muted-foreground"
                                        >
                                          {sub.name}
                                        </label>
                                      </div>
                                    );
                                  })}
                                </div>,
                                document.body,
                              )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wider">
                      Khoảng giá
                    </h4>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Thấp nhất"
                        className="border-transparent bg-muted/60 text-sm dark:bg-card"
                        value={priceMinInput}
                        onChange={(e) => setPriceMinInput(e.target.value)}
                      />
                      <span className="text-muted-foreground">-</span>
                      <Input
                        placeholder="Cao nhất"
                        className="border-transparent bg-muted/60 text-sm dark:bg-card"
                        value={priceMaxInput}
                        onChange={(e) => setPriceMaxInput(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 relative z-0">
            <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center">
              <div>
                <h1 className="text-2xl font-bold font-display hidden md:block">{selectedCategoryText}</h1>
                {fetchError ? (
                  <p className="mt-1 text-sm text-destructive">{fetchError}</p>
                ) : (
                  <p className="text-muted-foreground text-sm">{listings.length} kết quả tìm thấy</p>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Sắp xếp:</span>
                <Select
                  value={
                    SORT_VALUES_IN_SELECT.has(sortBy) ? sortBy : DEFAULT_SORT
                  }
                  onValueChange={(v) => setSortBy(v as ListingSearchSort)}
                >
                  <SelectTrigger className="w-full border-transparent bg-muted/60 sm:w-[220px] dark:bg-card">
                    <SelectValue placeholder="Sắp xếp theo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPDATED_AT_DESC">Cập nhật mới nhất</SelectItem>
                    <SelectItem value="CREATED_AT_DESC">Đăng mới nhất</SelectItem>
                    <SelectItem value="NAME_ASC">Tên A → Z</SelectItem>
                    <SelectItem value="RELEVANCE">Liên quan từ khóa</SelectItem>
                    <SelectItem value="DISTANCE">Gần nhất (khoảng cách)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {sortBy === "RELEVANCE" && !keyword.trim() && (
              <p className="mb-4 text-xs text-muted-foreground leading-snug">
                Không có từ khóa trong URL thì máy chủ xếp theo «Cập nhật mới nhất».
              </p>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-card rounded-2xl p-4 border space-y-4">
                    <Skeleton className="w-full aspect-square rounded-xl" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-5 w-1/2" />
                  </div>
                ))}
              </div>
            ) : listings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((row) => (
                  <ListingCard key={row.id} row={row} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card py-20 text-center">
                <img
                  src={`${import.meta.env.BASE_URL}images/empty-cart.png`}
                  alt="Không tìm thấy"
                  className="w-48 h-48 mx-auto opacity-50 mb-4"
                />
                <h3 className="text-xl font-bold text-foreground mb-2">Không tìm thấy tin đăng</h3>
                <p className="text-muted-foreground mb-6">Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.</p>
                <Button type="button" onClick={resetFiltersPreserveKeyword}>
                  Xóa bộ lọc
                </Button>
              </div>
            )}

            {listings.length > 0 && !isLoading && (
              <div className="mt-12 flex justify-center">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled
                    className="h-10 w-10 rounded-full border-transparent bg-card p-0"
                  >
                    1
                  </Button>
                  <Button variant="ghost" className="w-10 h-10 p-0 rounded-full">
                    2
                  </Button>
                  <Button variant="ghost" className="w-10 h-10 p-0 rounded-full">
                    3
                  </Button>
                  <Button variant="ghost" className="w-10 h-10 p-0 rounded-full">
                    <ChevronDown className="w-4 h-4 -rotate-90" />
                  </Button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
