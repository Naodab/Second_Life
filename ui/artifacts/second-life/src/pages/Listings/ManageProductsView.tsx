import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  FileText,
  Loader2,
  Package,
  Plus,
  RotateCcw,
  Search,
  Store,
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
import { getAllCategories, type CategoryResponse } from "@/api/categories";
import {
  getFacilityPrimarySubcategories,
  getOwnedProductPage,
  type FacilityProductSort,
  type PrimarySubcategorySummary,
  type ProductItemResponse,
  type ProductStatus,
} from "@/api/product";
import { cn } from "@/lib/utils";
import { ManageProductPaginationBar } from "@/components/ListingPaginationBar";

const DEFAULT_PRODUCT_THUMB =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=480&h=480&fit=crop";

const PAGE_SIZE = 12;
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
      d = new Date(
        y,
        mo - 1,
        day,
        Number.isFinite(h) ? h : 0,
        Number.isFinite(min) ? min : 0,
        Number.isFinite(sec) ? sec : 0,
      );
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

export function ManageProductsView({
  contextFacilityId,
  onViewProduct,
  onCreateProduct,
  onCreateListingForProduct,
}: {
  contextFacilityId: string;
  onViewProduct: (productId: string) => void;
  onCreateProduct: () => void;
  onCreateListingForProduct?: (productId: string) => void;
}) {
  const [primarySubcategories, setPrimarySubcategories] = useState<PrimarySubcategorySummary[]>([]);
  const [catalogCategories, setCatalogCategories] = useState<CategoryResponse[]>([]);
  const [selectedCatalogCategoryIds, setSelectedCatalogCategoryIds] = useState<string[]>([]);
  const [productNameInput, setProductNameInput] = useState("");
  const [debouncedProductName, setDebouncedProductName] = useState("");
  const [productSort, setProductSort] = useState<FacilityProductSort>(DEFAULT_PRODUCT_SORT);
  const [productSubcategorySelections, setProductSubcategorySelections] = useState<string[]>([]);
  const [status, setStatus] = useState<"ALL" | ProductStatus>("ALL");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<ProductItemResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await getFacilityPrimarySubcategories(contextFacilityId || "");
        if (!cancelled) {
          setPrimarySubcategories(Array.isArray(list) ? list : []);
        }
      } catch {
        if (!cancelled) setPrimarySubcategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [contextFacilityId]);

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
    setPage(0);
  }, [
    debouncedProductName,
    productSort,
    status,
    productQueryCategoryFilters.categoryIdsKey,
    productSubcategoryFilterKey,
  ]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getOwnedProductPage({
          page,
          pageSize: PAGE_SIZE,
          keyword: debouncedProductName || undefined,
          sortBy: productSort,
          status: status === "ALL" ? undefined : status,
          subCategoryIds:
            productSubcategorySelections.length > 0 ? productSubcategorySelections : undefined,
          categoryIds: productQueryCategoryFilters.categoryIds,
        });
        if (!cancelled) {
          setRows(Array.isArray(data.items) ? data.items : []);
          setTotalCount(typeof data.totalCount === "number" ? data.totalCount : 0);
        }
      } catch (e) {
        if (!cancelled) {
          setRows([]);
          setError(e instanceof Error ? e.message : "Không tải được sản phẩm.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    page,
    debouncedProductName,
    productSort,
    status,
    productSubcategoryFilterKey,
    productQueryCategoryFilters.categoryIdsKey,
  ]);

  const resetProductFilters = () => {
    setProductNameInput("");
    setDebouncedProductName("");
    setProductSort(DEFAULT_PRODUCT_SORT);
    setSelectedCatalogCategoryIds([]);
    setProductSubcategorySelections([]);
    setStatus("ALL");
    setPage(0);
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

  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const canCreateListing = Boolean(onCreateListingForProduct);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold">Sản phẩm</h2>
        <Button onClick={onCreateProduct} className="rounded-full shrink-0 w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-1.5" /> Đăng product mới
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="border-b border-border px-4 py-3 sm:px-5 bg-muted/40">
          <p className="text-sm font-medium">Lọc &amp; sắp xếp</p>
        </div>

        <div className="p-4 sm:p-5 space-y-5">
          <div className="flex flex-col xl:flex-row gap-3 xl:items-end">
            <div className="flex-1 space-y-1.5 min-w-0">
              <Label
                htmlFor="manage-product-search-name"
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
                  id="manage-product-search-name"
                  placeholder="Tên, mô tả, SKU…"
                  value={productNameInput}
                  onChange={(e) => setProductNameInput(e.target.value)}
                  className="pl-9 h-9 bg-background"
                />
              </div>
            </div>

            <div className="w-full sm:flex-1 sm:max-w-xs space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Sắp xếp</Label>
              <Select value={productSort} onValueChange={(v) => setProductSort(v as FacilityProductSort)}>
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

            <div className="w-full sm:flex-1 sm:max-w-[11rem] space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Trạng thái</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as "ALL" | ProductStatus)}>
                <SelectTrigger className="h-9 bg-background w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={6}>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  <SelectItem value="DRAFT">Bản nháp</SelectItem>
                  <SelectItem value="PUBLISHED">Đã đăng</SelectItem>
                  <SelectItem value="ARCHIVED">Đã ẩn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex xl:justify-end shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-2 w-full xl:w-auto"
                onClick={resetProductFilters}
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" aria-hidden /> Xóa bộ lọc
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
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
                            htmlFor={`manage-cat-main-${c.id}`}
                            className={cn(
                              "flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-2 text-sm transition-colors",
                              checked
                                ? "bg-primary/[0.08] ring-1 ring-primary/20"
                                : "hover:bg-muted/60",
                            )}
                          >
                            <Checkbox
                              id={`manage-cat-main-${c.id}`}
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
                      <>
                        Các danh mục chính đã chọn chưa kèm nhóm con trong catalog (kiểm tra nested
                        items từ /categories).
                      </>
                    ) : (
                      <>
                        Chưa có nhóm SP gắn tài khoản hoặc dữ liệu đang tải. Chọn danh mục chính để
                        hiện nhóm con từ catalog.
                      </>
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
                                  htmlFor={`manage-sub-pick-${item.id}`}
                                  className={cn(
                                    "flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                                    chk ? "bg-primary/[0.08]" : "hover:bg-muted/60",
                                  )}
                                >
                                  <Checkbox
                                    id={`manage-sub-pick-${item.id}`}
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
                            htmlFor={`manage-sub-pick-${s.id}`}
                            className={cn(
                              "flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                              chk ? "bg-primary/[0.08]" : "hover:bg-muted/60",
                            )}
                          >
                            <Checkbox
                              id={`manage-sub-pick-${s.id}`}
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

      <div>
        <h3 className="font-bold flex items-center gap-2 text-sm mb-3">
          <Store className="w-4 h-4 text-primary" aria-hidden /> Kết quả ({totalCount})
        </h3>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-card rounded-2xl border text-muted-foreground gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm">Đang tải sản phẩm…</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-card rounded-2xl border text-destructive text-sm">{error}</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border">
            <Package className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-40" aria-hidden />
            <p className="text-muted-foreground">Chưa có sản phẩm nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {rows.map((p) => {
              const createdLabel = formatProductCreatedAt(p.createdAt);
              return (
                <div
                  key={p.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:shadow-md"
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
                  {canCreateListing && (
                    <div className="px-3 pb-3 pt-0">
                      <Button
                        type="button"
                        size="sm"
                        className="w-full rounded-full shadow-md shadow-primary/20 text-xs font-medium"
                        disabled={p.status !== "PUBLISHED"}
                        title={
                          p.status === "PUBLISHED"
                            ? undefined
                            : "Chỉ sản phẩm đã xuất bản (published) mới tạo được bài đăng — mở chi tiết để xuất bản."
                        }
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (p.status !== "PUBLISHED" || !onCreateListingForProduct) return;
                          onCreateListingForProduct(p.id);
                        }}
                      >
                        <FileText className="w-3.5 h-3.5 mr-1.5 shrink-0 opacity-95" aria-hidden />
                        Đăng bài
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && totalCount > 0 && (
          <ManageProductPaginationBar
            currentPage={page}
            totalPages={pageCount}
            pageSize={PAGE_SIZE}
            totalItems={totalCount}
            itemLabel="sản phẩm"
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
