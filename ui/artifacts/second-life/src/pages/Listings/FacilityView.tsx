import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Store,
  MapPin,
  Star,
  Package,
  Eye,
  Upload,
  Loader2,
  FileText,
  Tag,
  CalendarDays,
  Search,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllCategories, type CategoryResponse } from "@/api/categories";
import { facilityAvatarUrl, type FacilityWithPlaceNames } from "@/api/facility";
import { getFacilityListingPage, type ListingItemResponse } from "@/api/listing";
import {
  getFacilityPrimarySubcategories,
  getFacilityProductPage,
  type FacilityProductSort,
  type PrimarySubcategorySummary,
  type ProductItemResponse,
  type ProductStatus,
} from "@/api/product";
import { formatCurrency, cn } from "@/lib/utils";

const DEFAULT_PRODUCT_THUMB =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=480&h=480&fit=crop";

const PRODUCT_PAGE_SIZE = 12;
const LISTING_PAGE_SIZE = 12;

const DEFAULT_PRODUCT_SORT: FacilityProductSort = "UPDATED_AT_DESC";

function parentCategoryIdsForSubSelections(
  subIds: string[],
  catalog: CategoryResponse[],
): string[] {
  if (subIds.length === 0) return [];
  const set = new Set<string>();
  for (const sid of subIds) {
    if (!sid) continue;
    for (const cat of catalog) {
      if ((cat.items ?? []).some((s) => s?.id === sid)) {
        set.add(cat.id);
      }
    }
  }
  return [...set].sort();
}

const PRODUCT_SORT_OPTIONS: { value: FacilityProductSort; label: string }[] = [
  { value: "UPDATED_AT_DESC", label: "Cập nhật mới nhất" },
  { value: "CREATED_AT_DESC", label: "Tạo mới nhất" },
  { value: "NAME_ASC", label: "Tên A → Z" },
  { value: "RELEVANCE", label: "Liên quan từ khóa" },
];

type PageSlot = { type: "page"; index: number } | { type: "ellipsis"; key: string };

function buildPageSlots(currentPage: number, totalPages: number): PageSlot[] {
  const cap = Math.max(1, totalPages);
  const cur = Math.min(Math.max(0, currentPage), cap - 1);
  if (cap <= 1) {
    return [{ type: "page", index: 0 }];
  }

  let raw: number[];
  if (cap <= 9) {
    raw = Array.from({ length: cap }, (_, i) => i);
  } else {
    const pages = new Set<number>([0, cap - 1]);
    for (let d = -2; d <= 2; d++) {
      const p = cur + d;
      if (p >= 0 && p < cap) {
        pages.add(p);
      }
    }
    raw = [...pages].sort((a, b) => a - b);
  }

  const slots: PageSlot[] = [];
  let prev = -2;
  for (const p of raw) {
    if (p - prev > 1) {
      slots.push({ type: "ellipsis", key: `${prev}-${p}` });
    }
    slots.push({ type: "page", index: p });
    prev = p;
  }
  return slots;
}

function ManagePagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  itemLabel,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  itemLabel: string;
  onPageChange: (zeroBasedPage: number) => void;
}) {
  const slots = useMemo(
    () => buildPageSlots(currentPage, totalPages),
    [currentPage, totalPages],
  );

  return (
    <div className="flex flex-col gap-4 pt-6 mt-6 border-t items-end">
      <p className="text-xs text-muted-foreground tabular-nums text-right w-full">
        Trang {currentPage + 1}/{Math.max(1, totalPages)} · Tối đa {pageSize} {itemLabel} / trang · {totalItems} mục
      </p>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 w-full">
        <div className="flex flex-wrap items-center gap-1.5 justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="tabular-nums"
            disabled={currentPage <= 0}
            onClick={() => onPageChange(Math.max(0, currentPage - 1))}
          >
            Trước
          </Button>
          {slots.map((slot) =>
            slot.type === "ellipsis" ? (
              <span
                key={slot.key}
                className="px-1 text-muted-foreground text-sm select-none"
                aria-hidden
              >
                …
              </span>
            ) : (
              <Button
                key={slot.index}
                type="button"
                variant={currentPage === slot.index ? "default" : "outline"}
                size="sm"
                className="min-w-9 px-2.5 tabular-nums"
                onClick={() => onPageChange(slot.index)}
              >
                {slot.index + 1}
              </Button>
            ),
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="tabular-nums"
            disabled={currentPage + 1 >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  );
}

function productStatusLabel(status: ProductStatus): string {
  switch (status) {
    case "DRAFT":
      return "Bản nháp";
    case "PUBLISHED":
      return "Đã đăng";
    case "ARCHIVED":
      return "Đã ẩn";
    default:
      return status;
  }
}

function listingTypeLabel(row: ListingItemResponse): string {
  return row.listingType === "RENT" ? "Cho thuê" : "Bán";
}

function listingStatusLabel(row: ListingItemResponse): string {
  switch (row.listingStatus) {
    case "ACTIVE":
      return "Đang hiển thị";
    case "INACTIVE":
      return "Tắt";
    case "SOLD":
      return "Đã bán";
    case "RENTED":
      return "Đã cho thuê";
    case "PENDING":
      return "Chờ duyệt";
    case "APPROVED":
      return "Đã duyệt";
    case "REJECTED":
      return "Từ chối";
    default:
      return row.listingStatus;
  }
}

/** ISO string from API or legacy Jackson numeric array `[y, mo, d, h, min, sec, nano?]`. */
function formatProductCreatedAt(raw: unknown): string | null {
  let d: Date | null = null;
  if (typeof raw === "string" && raw.trim()) {
    d = new Date(raw.trim());
  } else if (Array.isArray(raw) && raw.length >= 3) {
    const y = Number(raw[0]);
    const mo = Number(raw[1]);
    const day = Number(raw[2]);
    const h = raw.length > 3 ? Number(raw[3]) : 0;
    const min = raw.length > 4 ? Number(raw[4]) : 0;
    const sec = raw.length > 5 ? Number(raw[5]) : 0;
    if ([y, mo, day].every((n) => Number.isFinite(n))) {
      d = new Date(y, mo - 1, day, Number.isFinite(h) ? h : 0, Number.isFinite(min) ? min : 0, Number.isFinite(sec) ? sec : 0);
    }
  }
  if (!d || Number.isNaN(d.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat("vi-VN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

function formatPriceBand(minPrice: number | null, maxPrice: number | null): string | null {
  if (minPrice != null && maxPrice != null) {
    return minPrice === maxPrice
      ? formatCurrency(minPrice)
      : `${formatCurrency(minPrice)} – ${formatCurrency(maxPrice)}`;
  }

  if (minPrice != null) {
    return formatCurrency(minPrice);
  }

  if (maxPrice != null) {
    return formatCurrency(maxPrice);
  }

  return null;
}

export function FacilityView({
  facility,
  onViewProduct,
  onAddProduct,
  onCreateListing,
  onCreateListingForProduct,
  onViewUnpublished,
  onUpdateAvatar,
  pendingCount,
}: {
  facility: FacilityWithPlaceNames;
  onViewProduct: (id: string) => void;
  onAddProduct: () => void;
  onCreateListing: () => void;
  /** Open create listing with product pre-selected via query. */
  onCreateListingForProduct: (productId: string) => void;
  onViewUnpublished: () => void;
  onUpdateAvatar: (file: File) => Promise<void>;
  pendingCount: number;
}) {
  const [hubTab, setHubTab] = useState<"products" | "listings">("products");
  const [primarySubcategories, setPrimarySubcategories] = useState<PrimarySubcategorySummary[]>([]);
  const [catalogCategories, setCatalogCategories] = useState<CategoryResponse[]>([]);
  const [selectedCatalogCategoryIds, setSelectedCatalogCategoryIds] = useState<string[]>([]);
  const [productNameInput, setProductNameInput] = useState("");
  const [debouncedProductName, setDebouncedProductName] = useState("");
  const [productSort, setProductSort] = useState<FacilityProductSort>(DEFAULT_PRODUCT_SORT);
  const [productSubcategorySelections, setProductSubcategorySelections] = useState<string[]>([]);
  const [productPage, setProductPage] = useState(0);
  const [listingPage, setListingPage] = useState(0);
  const [productTotal, setProductTotal] = useState(0);
  const [listingTotal, setListingTotal] = useState(0);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [productRows, setProductRows] = useState<ProductItemResponse[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [listingRows, setListingRows] = useState<ListingItemResponse[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsError, setListingsError] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProductPage(0);
    setListingPage(0);
    setSelectedCatalogCategoryIds([]);
    setProductSubcategorySelections([]);
    setProductNameInput("");
    setDebouncedProductName("");
    setProductSort(DEFAULT_PRODUCT_SORT);
  }, [facility.id]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedProductName(productNameInput.trim()), 400);
    return () => clearTimeout(t);
  }, [productNameInput]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cats = await getAllCategories();
        if (!cancelled) {
          setCatalogCategories(Array.isArray(cats) ? cats : []);
        }
      } catch {
        if (!cancelled) {
          setCatalogCategories([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedCatalogCategoryIdsKey = useMemo(
    () => [...selectedCatalogCategoryIds].sort().join("|"),
    [selectedCatalogCategoryIds],
  );

  const groupedSubsFromCatalog = useMemo(() => {
    const ids = [...selectedCatalogCategoryIds].sort();
    const groups: { categoryId: string; categoryName: string; items: { id: string; name: string }[] }[] =
      [];
    for (const cid of ids) {
      const cat = catalogCategories.find((c) => c.id === cid);
      if (!cat) continue;
      const items = (cat.items ?? []).filter((s) => s?.id && s?.name);
      if (items.length > 0) {
        groups.push({
          categoryId: cat.id,
          categoryName: cat.name,
          items: items.map((s) => ({ id: s.id, name: s.name })),
        });
      }
    }
    return groups;
  }, [selectedCatalogCategoryIdsKey, catalogCategories]);

  const catalogSubIdsUnion = useMemo(() => {
    const set = new Set<string>();
    for (const g of groupedSubsFromCatalog) {
      for (const s of g.items) {
        set.add(s.id);
      }
    }
    return [...set].sort();
  }, [groupedSubsFromCatalog]);

  const pickerSubIds = useMemo(() => {
    if (selectedCatalogCategoryIds.length > 0) {
      return catalogSubIdsUnion;
    }
    return primarySubcategories.map((p) => p.id);
  }, [selectedCatalogCategoryIds.length, catalogSubIdsUnion, primarySubcategories]);

  const pickerSubIdsKey = useMemo(() => [...pickerSubIds].sort().join("|"), [pickerSubIds]);

  useEffect(() => {
    const allowed = new Set(pickerSubIds);
    setProductSubcategorySelections((prev) => prev.filter((id) => allowed.has(id)));
  }, [pickerSubIdsKey]);

  const productSubcategoryFilterKey = useMemo(
    () => [...productSubcategorySelections].sort().join("|"),
    [productSubcategorySelections],
  );

  const productQueryCategoryFilters = useMemo(() => {
    if (productSubcategorySelections.length > 0) {
      if (selectedCatalogCategoryIds.length > 0) {
        const ids = [...selectedCatalogCategoryIds];
        return {
          categoryIds: ids,
          categoryIdsKey: [...ids].sort().join("|"),
        };
      }
      const inferred = parentCategoryIdsForSubSelections(
        productSubcategorySelections,
        catalogCategories,
      );
      const ids = inferred.length > 0 ? inferred : undefined;
      return {
        categoryIds: ids,
        categoryIdsKey: ids?.length ? [...ids].sort().join("|") : "",
      };
    }
    const ids =
      selectedCatalogCategoryIds.length > 0 ? [...selectedCatalogCategoryIds] : undefined;
    return {
      categoryIds: ids,
      categoryIdsKey: selectedCatalogCategoryIdsKey,
    };
  }, [
    productSubcategoryFilterKey,
    selectedCatalogCategoryIdsKey,
    catalogCategories,
    selectedCatalogCategoryIds,
    productSubcategorySelections,
  ]);

  useEffect(() => {
    setProductPage(0);
  }, [debouncedProductName, productSort, productQueryCategoryFilters.categoryIdsKey, productSubcategoryFilterKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await getFacilityPrimarySubcategories(facility.id);
        if (!cancelled) {
          setPrimarySubcategories(Array.isArray(rows) ? rows : []);
        }
      } catch {
        if (!cancelled) {
          setPrimarySubcategories([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [facility.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [pMeta, lMeta] = await Promise.all([
          getFacilityProductPage(facility.id, { page: 0, pageSize: 1 }),
          getFacilityListingPage(facility.id, { page: 0, pageSize: 1 }),
        ]);
        if (!cancelled) {
          setProductTotal(typeof pMeta?.totalCount === "number" ? pMeta.totalCount : 0);
          setListingTotal(typeof lMeta?.totalCount === "number" ? lMeta.totalCount : 0);
        }
      } catch {
        if (!cancelled) {
          setProductTotal(0);
          setListingTotal(0);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [facility.id]);

  useEffect(() => {
    if (hubTab !== "products") {
      return;
    }
    let cancelled = false;
    (async () => {
      setProductsLoading(true);
      setProductsError(null);
      try {
        const data = await getFacilityProductPage(facility.id, {
          page: productPage,
          pageSize: PRODUCT_PAGE_SIZE,
          keyword: debouncedProductName || undefined,
          sortBy: productSort,
          subCategoryIds:
            productSubcategorySelections.length > 0 ? productSubcategorySelections : undefined,
          categoryIds: productQueryCategoryFilters.categoryIds,
        });
        if (!cancelled) {
          setProductRows(Array.isArray(data.items) ? data.items : []);
          setProductTotal(typeof data.totalCount === "number" ? data.totalCount : 0);
        }
      } catch (e) {
        if (!cancelled) {
          setProductRows([]);
          setProductsError(e instanceof Error ? e.message : "Không tải được sản phẩm.");
        }
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    facility.id,
    hubTab,
    productPage,
    debouncedProductName,
    productSort,
    productSubcategoryFilterKey,
    productQueryCategoryFilters.categoryIdsKey,
  ]);

  useEffect(() => {
    if (hubTab !== "listings") {
      return;
    }
    let cancelled = false;
    (async () => {
      setListingsLoading(true);
      setListingsError(null);
      try {
        const data = await getFacilityListingPage(facility.id, {
          page: listingPage,
          pageSize: LISTING_PAGE_SIZE,
        });
        if (!cancelled) {
          setListingRows(Array.isArray(data.items) ? data.items : []);
          setListingTotal(typeof data.totalCount === "number" ? data.totalCount : 0);
        }
      } catch (e) {
        if (!cancelled) {
          setListingRows([]);
          setListingsError(e instanceof Error ? e.message : "Không tải được bài đăng.");
        }
      } finally {
        if (!cancelled) setListingsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [facility.id, hubTab, listingPage]);

  const resetProductFilters = () => {
    setProductNameInput("");
    setDebouncedProductName("");
    setProductSort(DEFAULT_PRODUCT_SORT);
    setSelectedCatalogCategoryIds([]);
    setProductSubcategorySelections([]);
  };

  const toggleCatalogCategory = (categoryId: string) => {
    setSelectedCatalogCategoryIds((prev) =>
      prev.includes(categoryId) ? prev.filter((x) => x !== categoryId) : [...prev, categoryId],
    );
  };

  const toggleProductSubcategory = (id: string) => {
    setProductSubcategorySelections((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const productPageCount = Math.max(1, Math.ceil(productTotal / PRODUCT_PAGE_SIZE));
  const listingPageCount = Math.max(1, Math.ceil(listingTotal / LISTING_PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={facilityAvatarUrl(facility)}
              className="w-14 h-14 rounded-full border-2 border-primary/20 object-cover"
              alt=""
            />
            <div>
              <h2 className="font-bold text-lg flex items-center gap-2">{facility.name}</h2>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" /> {facility.address}, {facility.wardName}
              </div>
              <div className="text-xs font-medium text-foreground">{facility.provinceName}</div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="rounded-full relative" onClick={onViewUnpublished}>
              <Eye className="w-3.5 h-3.5 mr-1.5" /> Sản phẩm chưa đăng
              {pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {pendingCount}
                </span>
              )}
            </Button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setIsUploadingAvatar(true);
                try {
                  await onUpdateAvatar(file);
                } finally {
                  setIsUploadingAvatar(false);
                  e.target.value = "";
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={isUploadingAvatar}
              onClick={() => avatarInputRef.current?.click()}
            >
              {isUploadingAvatar ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5 mr-1.5" />
              )}
              Cập nhật avatar
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5 text-amber-500 font-semibold">
            <Star className="w-3.5 h-3.5 fill-current" /> {facility.averageRating ?? 0}
          </div>
          <span>•</span>
          <span>{Number(facility.orderCount ?? 0)} đơn</span>
          <span>•</span>
          <span>{Number(facility.viewCount ?? 0)} lượt xem</span>
        </div>
      </div>

      <Tabs
        value={hubTab}
        onValueChange={(v) => setHubTab(v as "products" | "listings")}
        className="w-full"
      >
        <div className="rounded-2xl border border-border/80 bg-background shadow-sm overflow-hidden">
          <TabsList
            className={cn(
              "w-full h-auto flex flex-nowrap items-stretch justify-start gap-0 rounded-none border-0 p-0",
              "bg-[#e8eaed] dark:bg-zinc-900/90",
              "shadow-[inset_0_-1px_0_0_hsl(var(--border))]",
            )}
          >
            <TabsTrigger
              value="products"
              className={cn(
                "group relative flex-1 sm:flex-none sm:min-w-[156px] justify-center gap-2 rounded-none rounded-t-lg border-0 px-4 py-3 text-sm font-medium",
                "ring-offset-0 focus-visible:ring-2 focus-visible:ring-primary/30",
                "data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground/90",
                "data-[state=inactive]:hover:bg-black/[0.04] dark:data-[state=inactive]:hover:bg-white/[0.06]",
                "data-[state=active]:z-[2] data-[state=active]:mb-[-1px] data-[state=active]:bg-background",
                "data-[state=active]:text-foreground data-[state=active]:shadow-[0_-1px_6px_rgba(0,0,0,0.06)]",
                "data-[state=active]:border-x data-[state=active]:border-t data-[state=active]:border-border data-[state=active]:border-b-background",
              )}
            >
              <Store className="w-[18px] h-[18px] shrink-0 opacity-80 group-data-[state=active]:opacity-100" />
              <span className="flex items-center gap-1.5">
                Sản phẩm
                <span
                  className={cn(
                    "tabular-nums text-xs font-semibold px-2 py-0.5 rounded-full",
                    hubTab === "products"
                      ? "bg-muted text-foreground"
                      : "bg-black/[0.06] dark:bg-white/10 text-muted-foreground",
                  )}
                >
                  {productTotal}
                </span>
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="listings"
              className={cn(
                "group relative flex-1 sm:flex-none sm:min-w-[156px] justify-center gap-2 rounded-none rounded-t-lg border-0 px-4 py-3 text-sm font-medium",
                "ring-offset-0 focus-visible:ring-2 focus-visible:ring-primary/30",
                "data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground/90",
                "data-[state=inactive]:hover:bg-black/[0.04] dark:data-[state=inactive]:hover:bg-white/[0.06]",
                "data-[state=active]:z-[2] data-[state=active]:mb-[-1px] data-[state=active]:bg-background",
                "data-[state=active]:text-foreground data-[state=active]:shadow-[0_-1px_6px_rgba(0,0,0,0.06)]",
                "data-[state=active]:border-x data-[state=active]:border-t data-[state=active]:border-border data-[state=active]:border-b-background",
              )}
            >
              <FileText className="w-[18px] h-[18px] shrink-0 opacity-80 group-data-[state=active]:opacity-100" />
              <span className="flex items-center gap-1.5">
                Bài đăng
                <span
                  className={cn(
                    "tabular-nums text-xs font-semibold px-2 py-0.5 rounded-full",
                    hubTab === "listings"
                      ? "bg-muted text-foreground"
                      : "bg-black/[0.06] dark:bg-white/10 text-muted-foreground",
                  )}
                >
                  {listingTotal}
                </span>
              </span>
            </TabsTrigger>
            <div className="flex-1 min-w-[8px] border-b border-border bg-[#e8eaed] dark:bg-zinc-900/90" aria-hidden />
          </TabsList>

          <div className="bg-background border-t border-border px-4 sm:px-5 pt-5 pb-5">
            <TabsContent value="products" className="space-y-4 mt-0 focus-visible:outline-none">
              {hubTab === "products" && (
                <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
                  <div className="border-b border-border px-4 py-3 sm:px-5 bg-muted/40">
                    <p className="text-sm font-medium">Lọc & sắp xếp</p>
                  </div>

                  <div className="p-4 sm:p-5 space-y-5">
                    <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <Label
                          htmlFor="facility-product-search-name"
                          className="text-xs font-medium text-muted-foreground"
                        >
                          Tên / từ khóa
                        </Label>
                        <div className="relative">
                          <Search
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                            aria-hidden
                          />
                          <Input
                            id="facility-product-search-name"
                            placeholder="Tên, mô tả, SKU…"
                            value={productNameInput}
                            onChange={(e) => setProductNameInput(e.target.value)}
                            className="pl-9 h-9 bg-background"
                          />
                        </div>
                      </div>

                      <div className="w-full lg:w-52 shrink-0 space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">Sắp xếp</Label>
                        <Select
                          value={productSort}
                          onValueChange={(v) => setProductSort(v as FacilityProductSort)}
                        >
                          <SelectTrigger className="h-9 bg-background w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent position="popper" sideOffset={6}>
                            {PRODUCT_SORT_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {productSort === "RELEVANCE" && !debouncedProductName && (
                          <p className="text-[11px] text-muted-foreground leading-snug">
                            Không có từ khóa thì máy chủ sẽ sắp như «Cập nhật mới nhất».
                          </p>
                        )}
                      </div>

                      <div className="flex lg:justify-end shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 gap-2 w-full lg:w-auto"
                          onClick={resetProductFilters}
                        >
                          <RotateCcw className="w-3.5 h-3.5 shrink-0" aria-hidden /> Xóa bộ lọc
                        </Button>
                      </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-4">
                      {/* Danh mục chính — multi */}
                      <div className="flex flex-col rounded-lg border bg-background overflow-hidden min-h-[12rem] max-h-[min(22rem,50vh)]">
                        <header className="px-3 py-2 border-b bg-muted/30">
                          <p className="text-xs font-semibold">Danh mục chính</p>
                        </header>
                        <div className="flex-1 overflow-y-auto overscroll-contain p-1.5">
                          {catalogCategories.length === 0 ? (
                            <p className="text-xs text-muted-foreground px-2 py-6 text-center leading-relaxed">
                              Chưa có danh mục từ API /categories — không thể lọc theo catalog.
                            </p>
                          ) : (
                            <ul className="space-y-0.5">
                              {catalogCategories.map((c) => {
                                const checked = selectedCatalogCategoryIds.includes(c.id);
                                return (
                                  <li key={c.id}>
                                    <label
                                      htmlFor={`cat-main-${c.id}`}
                                      className={cn(
                                        "flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-2 text-sm transition-colors",
                                        checked
                                          ? "bg-primary/[0.08] ring-1 ring-primary/20"
                                          : "hover:bg-muted/60",
                                      )}
                                    >
                                      <Checkbox
                                        id={`cat-main-${c.id}`}
                                        checked={checked}
                                        onCheckedChange={() => toggleCatalogCategory(c.id)}
                                        className="mt-0.5 shrink-0"
                                      />
                                      <span className="leading-snug pt-px">{c.name}</span>
                                    </label>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      </div>

                      {/* Danh mục con */}
                      <div className="flex flex-col rounded-lg border bg-background overflow-hidden min-h-[12rem] max-h-[min(22rem,50vh)]">
                        <header className="px-3 py-2 border-b bg-muted/30 flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold">Danh mục con</p>
                          {productSubcategorySelections.length > 0 ? (
                            <span className="tabular-nums text-[10px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground shrink-0">
                              {productSubcategorySelections.length}
                            </span>
                          ) : null}
                        </header>
                        <div className="flex-1 overflow-y-auto overscroll-contain p-1.5">
                          {pickerSubIds.length === 0 ? (
                            <p className="text-xs text-muted-foreground px-2 py-6 text-center leading-relaxed">
                              {selectedCatalogCategoryIds.length > 0 ? (
                                <>Các danh mục chính đã chọn chưa kèm nhóm con trong catalog (kiểm tra nested items từ /categories).</>
                              ) : (
                                <>Chưa có nhóm SP gắn cơ sở hoặc dữ liệu đang tải. Chọn danh mục chính để hiện nhóm con từ catalog.</>
                              )}
                            </p>
                          ) : selectedCatalogCategoryIds.length > 0 ? (
                            <div className="space-y-3">
                              {groupedSubsFromCatalog.map((g) => (
                                <div key={g.categoryId}>
                                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1 sticky top-0 bg-background">
                                    {g.categoryName}
                                  </p>
                                  <ul className="space-y-0.5">
                                    {g.items.map((item) => {
                                      const chk = productSubcategorySelections.includes(item.id);
                                      return (
                                        <li key={item.id}>
                                          <label
                                            htmlFor={`sub-pick-${item.id}`}
                                            className={cn(
                                              "flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                                              chk ? "bg-primary/[0.08]" : "hover:bg-muted/60",
                                            )}
                                          >
                                            <Checkbox
                                              id={`sub-pick-${item.id}`}
                                              checked={chk}
                                              onCheckedChange={() => toggleProductSubcategory(item.id)}
                                              className="mt-0.5 shrink-0"
                                            />
                                            <span className="leading-snug">{item.name}</span>
                                          </label>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <ul className="space-y-0.5">
                              {primarySubcategories.map((s) => {
                                const chk = productSubcategorySelections.includes(s.id);
                                return (
                                  <li key={s.id}>
                                    <label
                                      htmlFor={`sub-pick-${s.id}`}
                                      className={cn(
                                        "flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                                        chk ? "bg-primary/[0.08]" : "hover:bg-muted/60",
                                      )}
                                    >
                                      <Checkbox
                                        id={`sub-pick-${s.id}`}
                                        checked={chk}
                                        onCheckedChange={() => toggleProductSubcategory(s.id)}
                                        className="mt-0.5 shrink-0"
                                      />
                                      <span className="leading-snug">
                                        {s.name}{" "}
                                        <span className="tabular-nums text-muted-foreground font-normal">
                                          ({s.productCount})
                                        </span>
                                      </span>
                                    </label>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-bold flex items-center gap-2 text-sm">
                  <Store className="w-4 h-4 text-primary" /> Sản phẩm ({productTotal})
                </h3>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full shadow-md shadow-primary/20 shrink-0 w-full sm:w-auto"
                  onClick={onAddProduct}
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Thêm mặt hàng
                </Button>
              </div>

              <div>

                {productsLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border text-muted-foreground gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm">Đang tải sản phẩm…</p>
                  </div>
                ) : productsError ? (
                  <div className="text-center py-12 bg-white rounded-2xl border text-destructive text-sm">{productsError}</div>
                ) : (productRows?.length ?? 0) === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border">
                    <Package className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-40" />
                    <p className="text-muted-foreground">Chưa có sản phẩm nào</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {(productRows ?? []).map((p) => {
                      const createdLabel = formatProductCreatedAt(p.createdAt);
                      return (
                        <div
                          key={p.id}
                          className="bg-white rounded-2xl border hover:shadow-md transition-all overflow-hidden group flex flex-col"
                        >
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => onViewProduct(p.id)}
                            onKeyDown={(e) => e.key === "Enter" && onViewProduct(p.id)}
                            className="cursor-pointer text-left flex-1 min-w-0"
                          >
                            <div className="aspect-square overflow-hidden bg-muted">
                              <img
                                src={(p.thumbnailImage && p.thumbnailImage.trim()) || DEFAULT_PRODUCT_THUMB}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                alt=""
                              />
                            </div>
                            <div className="p-3 space-y-1.5">
                              <p className="font-semibold text-sm line-clamp-2 leading-snug">{p.name}</p>
                              {createdLabel && (
                                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <CalendarDays className="w-3 h-3 shrink-0 opacity-70" aria-hidden />
                                  <span>Ngày tạo: {createdLabel}</span>
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                <span className="text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                  {productStatusLabel(p.status)}
                                </span>
                                <span className="text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                  {p.variantCount} loại SP
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="px-3 pb-3 pt-0">
                            <Button
                              type="button"
                              size="sm"
                              className="w-full rounded-full shadow-md shadow-primary/20 text-xs font-medium"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onCreateListingForProduct(p.id);
                              }}
                            >
                              <FileText className="w-3.5 h-3.5 mr-1.5 shrink-0 opacity-95" aria-hidden />
                              Đăng bài
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {!productsLoading &&
                  !productsError &&
                  hubTab === "products" &&
                  productTotal > 0 && (
                    <ManagePagination
                      currentPage={productPage}
                      totalPages={productPageCount}
                      pageSize={PRODUCT_PAGE_SIZE}
                      totalItems={productTotal}
                      itemLabel="sản phẩm"
                      onPageChange={setProductPage}
                    />
                  )}
              </div>
            </TabsContent>

            <TabsContent value="listings" className="space-y-4 mt-0 focus-visible:outline-none">
              <div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
                  <h3 className="font-bold flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-primary" /> Bài đăng ({listingTotal})
                  </h3>
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-full shadow-md shadow-primary/20 shrink-0 w-full sm:w-auto"
                    onClick={onCreateListing}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Tạo bài đăng
                  </Button>
                </div>

                {listingsLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border text-muted-foreground gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm">Đang tải bài đăng…</p>
                  </div>
                ) : listingsError ? (
                  <div className="text-center py-12 bg-white rounded-2xl border text-destructive text-sm">{listingsError}</div>
                ) : (listingRows?.length ?? 0) === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border">
                    <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-40" />
                    <p className="text-muted-foreground">Chưa có bài đăng nào cho cơ sở này</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(listingRows ?? []).map((row) => {
                      const band = formatPriceBand(row.minPrice, row.maxPrice);
                      return (
                        <div
                          key={row.id}
                          className="bg-white rounded-2xl border shadow-sm flex overflow-hidden gap-3 p-3 items-stretch"
                        >
                          <div className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 rounded-xl overflow-hidden bg-muted">
                            <img
                              src={(row.thumbnailImage && row.thumbnailImage.trim()) || DEFAULT_PRODUCT_THUMB}
                              className="w-full h-full object-cover"
                              alt=""
                            />
                          </div>
                          <div className="min-w-0 flex-1 flex flex-col gap-1">
                            <p className="font-semibold text-sm line-clamp-2">{row.title}</p>
                            {row.productName && (
                              <p className="text-xs text-muted-foreground line-clamp-1">SP: {row.productName}</p>
                            )}
                            {row.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">{row.description}</p>
                            )}
                            <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                                <Tag className="w-3 h-3" /> {listingTypeLabel(row)}
                              </span>
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                {listingStatusLabel(row)}
                              </span>
                              {band && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800">
                                  {band}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {!listingsLoading &&
                  !listingsError &&
                  hubTab === "listings" &&
                  listingTotal > 0 && (
                    <ManagePagination
                      currentPage={listingPage}
                      totalPages={listingPageCount}
                      pageSize={LISTING_PAGE_SIZE}
                      totalItems={listingTotal}
                      itemLabel="bài đăng"
                      onPageChange={setListingPage}
                    />
                  )}
              </div>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
