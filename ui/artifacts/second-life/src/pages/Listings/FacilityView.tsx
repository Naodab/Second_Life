import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  MapPin,
  Star,
  Eye,
  Upload,
  Loader2,
  FileText,
  Tag,
  Search,
  RotateCcw,
  ShoppingBag,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { facilityAvatarUrl, type FacilityWithPlaceNames } from "@/api/facility";
import { getFacilityListingPage, type ListingItemResponse } from "@/api/listing";
import { getFacilityProductPage, type ProductItemResponse } from "@/api/product";
import { formatCurrency, cn } from "@/lib/utils";
import { ListingPaginationBar } from "@/components/ListingPaginationBar";
import { OrdersView } from "./OrdersView";
import { useFacilityOrdersCount } from "./useFacilityOrdersPage";

const DEFAULT_PRODUCT_THUMB =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=480&h=480&fit=crop";

const LISTING_PAGE_SIZE = 12;
const LISTING_PRODUCT_PICKER_PAGE_SIZE = 12;
const LISTING_PRODUCT_FILTER_ALL = "__listing_product_all__";

function listingTypeLabel(row: ListingItemResponse): string {
  return row.listingType === "RENT" ? "Cho thuê" : "Bán";
}

function listingStatusLabel(row: ListingItemResponse): string {
  switch (row.listingStatus) {
    case "ACTIVE":
      return "Đang đăng";
    case "INACTIVE":
      return "Tạm ẩn";
    case "PENDING":
      return "Chưa duyệt";
    case "REJECTED":
      return "Từ chối";
    default:
      return row.listingStatus;
  }
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
  onManageProducts,
  onCreateListing,
  onViewUnpublished,
  onUpdateAvatar,
  pendingCount,
}: {
  facility: FacilityWithPlaceNames;
  onManageProducts: () => void;
  onCreateListing: () => void;
  onViewUnpublished: () => void;
  onUpdateAvatar: (file: File) => Promise<void>;
  pendingCount: number;
}) {
  const [hubTab, setHubTab] = useState<"listings" | "orders">("listings");
  const [listingPage, setListingPage] = useState(0);
  const [facilityListingsBadgeTotal, setFacilityListingsBadgeTotal] = useState(0);
  const [listingQueryTotal, setListingQueryTotal] = useState(0);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [listingRows, setListingRows] = useState<ListingItemResponse[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsError, setListingsError] = useState<string | null>(null);

  const [listingKeywordInput, setListingKeywordInput] = useState("");
  const [debouncedListingKeyword, setDebouncedListingKeyword] = useState("");
  const [listingFilterProductId, setListingFilterProductId] = useState<string>(LISTING_PRODUCT_FILTER_ALL);
  const [listingPickerProducts, setListingPickerProducts] = useState<ProductItemResponse[]>([]);
  const [listingPickerNextPage, setListingPickerNextPage] = useState(0);
  const [listingPickerTotal, setListingPickerTotal] = useState(0);
  const [listingPickerLoadingInit, setListingPickerLoadingInit] = useState(false);
  const [listingPickerLoadingMore, setListingPickerLoadingMore] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const ordersTabCount = useFacilityOrdersCount(facility.id);

  useEffect(() => {
    setListingPage(0);
    setListingKeywordInput("");
    setDebouncedListingKeyword("");
    setListingFilterProductId(LISTING_PRODUCT_FILTER_ALL);
    setListingPickerProducts([]);
    setListingPickerNextPage(0);
    setListingPickerTotal(0);
  }, [facility.id]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedListingKeyword(listingKeywordInput.trim()), 400);
    return () => clearTimeout(t);
  }, [listingKeywordInput]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const lMeta = await getFacilityListingPage(facility.id, { page: 0, pageSize: 1 });
        if (!cancelled) {
          setFacilityListingsBadgeTotal(typeof lMeta?.totalCount === "number" ? lMeta.totalCount : 0);
        }
      } catch {
        if (!cancelled) setFacilityListingsBadgeTotal(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [facility.id]);

  useEffect(() => {
    setListingPage(0);
  }, [debouncedListingKeyword, listingFilterProductId]);

  async function fetchListingPickerPage(pageIdx: number, append: boolean) {
    const isFirst = !append;
    if (isFirst) {
      setListingPickerLoadingInit(true);
    } else {
      setListingPickerLoadingMore(true);
    }
    try {
      const data = await getFacilityProductPage(facility.id, {
        page: pageIdx,
        pageSize: LISTING_PRODUCT_PICKER_PAGE_SIZE,
        sortBy: "UPDATED_AT_DESC",
      });
      const items = Array.isArray(data.items) ? data.items : [];
      const total = typeof data.totalCount === "number" ? data.totalCount : 0;
      setListingPickerTotal(total);
      setListingPickerNextPage(pageIdx + 1);
      setListingPickerProducts((prev) => {
        if (!append) {
          return items;
        }
        const seen = new Set(prev.map((p) => p.id));
        const merged = [...prev];
        for (const p of items) {
          if (!seen.has(p.id)) {
            seen.add(p.id);
            merged.push(p);
          }
        }
        return merged;
      });
    } finally {
      if (isFirst) {
        setListingPickerLoadingInit(false);
      } else {
        setListingPickerLoadingMore(false);
      }
    }
  }

  function handleListingProductSelectOpenChange(open: boolean) {
    if (!open) {
      return;
    }
    if (listingPickerProducts.length === 0) {
      void fetchListingPickerPage(0, false);
    }
  }

  function handleListingProductPickerScroll(el: HTMLDivElement) {
    const threshold = 48;
    if (listingPickerLoadingInit || listingPickerLoadingMore) {
      return;
    }
    if (listingPickerProducts.length >= listingPickerTotal || listingPickerTotal === 0) {
      return;
    }
    if (el.scrollHeight - el.scrollTop - el.clientHeight < threshold) {
      void fetchListingPickerPage(listingPickerNextPage, true);
    }
  }

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
          keyword: debouncedListingKeyword || undefined,
          productId:
            listingFilterProductId !== LISTING_PRODUCT_FILTER_ALL ? listingFilterProductId : undefined,
        });
        if (!cancelled) {
          setListingRows(Array.isArray(data.items) ? data.items : []);
          const total = typeof data.totalCount === "number" ? data.totalCount : 0;
          setListingQueryTotal(total);
          const noListingFilters =
            !debouncedListingKeyword && listingFilterProductId === LISTING_PRODUCT_FILTER_ALL;
          if (noListingFilters) {
            setFacilityListingsBadgeTotal(total);
          }
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
  }, [facility.id, hubTab, listingPage, debouncedListingKeyword, listingFilterProductId]);

  const resetListingFilters = () => {
    setListingKeywordInput("");
    setDebouncedListingKeyword("");
    setListingFilterProductId(LISTING_PRODUCT_FILTER_ALL);
    setListingPage(0);
  };

  const listingPageCount = Math.max(1, Math.ceil(listingQueryTotal / LISTING_PAGE_SIZE));

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
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
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-full"
              onClick={onManageProducts}
            >
              <Store className="w-3.5 h-3.5 mr-1.5" aria-hidden /> Quản lý sản phẩm
            </Button>
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
        onValueChange={(v) => setHubTab(v as "listings" | "orders")}
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
                  {facilityListingsBadgeTotal}
                </span>
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="orders"
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
              <ShoppingBag className="w-[18px] h-[18px] shrink-0 opacity-80 group-data-[state=active]:opacity-100" />
              <span className="flex items-center gap-1.5">
                Đơn hàng
                <span
                  className={cn(
                    "tabular-nums text-xs font-semibold px-2 py-0.5 rounded-full",
                    hubTab === "orders"
                      ? "bg-muted text-foreground"
                      : "bg-black/[0.06] dark:bg-white/10 text-muted-foreground",
                  )}
                >
                  {ordersTabCount}
                </span>
              </span>
            </TabsTrigger>
            <div
              className="flex-1 min-w-[8px] border-b border-border bg-[#e8eaed] dark:bg-zinc-900/90"
              aria-hidden
            />
          </TabsList>

          <div className="bg-background border-t border-border px-4 sm:px-5 pt-5 pb-5">
            <TabsContent value="listings" className="space-y-4 mt-0 focus-visible:outline-none">
              {hubTab === "listings" && (
                <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
                  <div className="border-b border-border px-4 py-3 sm:px-5 bg-muted/40">
                    <p className="text-sm font-medium">Tìm &amp; lọc bài đăng</p>
                  </div>
                  <div className="p-4 sm:p-5 space-y-4">
                    <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <Label
                          htmlFor="facility-listing-search-text"
                          className="text-xs font-medium text-muted-foreground"
                        >
                          Theo chữ (tiêu đề, mô tả, SKU)
                        </Label>
                        <div className="relative">
                          <Search
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                            aria-hidden
                          />
                          <Input
                            id="facility-listing-search-text"
                            placeholder="Tiêu đề, mô tả hoặc mã SKU biến thể…"
                            value={listingKeywordInput}
                            onChange={(e) => setListingKeywordInput(e.target.value)}
                            className="pl-9 h-9 bg-background"
                          />
                        </div>
                      </div>
                      <div className="w-full lg:flex-1 min-w-0 lg:max-w-md space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">
                          Theo sản phẩm
                        </Label>
                        <Select
                          value={listingFilterProductId}
                          onValueChange={setListingFilterProductId}
                          onOpenChange={handleListingProductSelectOpenChange}
                        >
                          <SelectTrigger className="h-9 bg-background w-full">
                            <SelectValue placeholder="Tất cả sản phẩm" />
                          </SelectTrigger>
                          <SelectContent
                            position="popper"
                            sideOffset={6}
                            className="max-h-72"
                            onScroll={(e) => handleListingProductPickerScroll(e.currentTarget)}
                          >
                            <SelectGroup>
                              <SelectItem value={LISTING_PRODUCT_FILTER_ALL}>
                                <span className="font-medium">Tất cả sản phẩm</span>
                              </SelectItem>
                              {listingPickerLoadingInit && listingPickerProducts.length === 0 ? (
                                <div className="flex items-center gap-2 py-3 px-2 text-muted-foreground text-sm">
                                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                                  Đang tải danh sách…
                                </div>
                              ) : (
                                listingPickerProducts.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    <span className="truncate">{p.name}</span>
                                  </SelectItem>
                                ))
                              )}
                              {listingPickerLoadingMore && listingPickerProducts.length > 0 && (
                                <div className="flex items-center gap-2 py-2 px-2 text-xs text-muted-foreground">
                                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                                  Đang tải thêm…
                                </div>
                              )}
                              {!listingPickerLoadingInit &&
                                listingPickerProducts.length === 0 &&
                                listingPickerTotal === 0 && (
                                  <p className="px-2 py-3 text-xs text-muted-foreground text-center">
                                    Chưa có sản phẩm trong cơ sở.
                                  </p>
                                )}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex lg:justify-end shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 gap-2 w-full lg:w-auto"
                          onClick={resetListingFilters}
                        >
                          <RotateCcw className="w-3.5 h-3.5 shrink-0" aria-hidden /> Xóa bộ lọc
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
                  <h3 className="font-bold flex items-center gap-2 text-sm">
                    <FileText className="w-4 h-4 text-primary" aria-hidden /> Bài đăng (
                    {listingQueryTotal}
                    {facilityListingsBadgeTotal !== listingQueryTotal ? (
                      <span className="font-normal text-muted-foreground tabular-nums">
                        {" "}
                        · toàn cửa hàng: {facilityListingsBadgeTotal}
                      </span>
                    ) : null}
                    )
                  </h3>
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-full shadow-md shadow-primary/20 shrink-0 w-full sm:w-auto"
                    onClick={onCreateListing}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" aria-hidden /> Tạo bài đăng
                  </Button>
                </div>

                {listingsLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 bg-card rounded-2xl border text-muted-foreground gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm">Đang tải bài đăng…</p>
                  </div>
                ) : listingsError ? (
                  <div className="text-center py-12 bg-card rounded-2xl border text-destructive text-sm">{listingsError}</div>
                ) : (listingRows?.length ?? 0) === 0 ? (
                  <div className="text-center py-12 bg-card rounded-2xl border">
                    <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-40" aria-hidden />
                    <p className="text-muted-foreground">Chưa có bài đăng nào cho cơ sở này</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(listingRows ?? []).map((row) => {
                      const band = formatPriceBand(row.minPrice, row.maxPrice);
                      return (
                        <div
                          key={row.id}
                          className="flex items-stretch gap-3 overflow-hidden rounded-2xl border bg-card p-3 shadow-sm"
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
                                <Tag className="w-3 h-3" aria-hidden /> {listingTypeLabel(row)}
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
                  listingQueryTotal > 0 && (
                    <ListingPaginationBar
                      currentPage={listingPage}
                      totalPages={listingPageCount}
                      pageSize={LISTING_PAGE_SIZE}
                      totalItems={listingQueryTotal}
                      itemLabel="bài đăng"
                      onPageChange={setListingPage}
                    />
                  )}
              </div>
            </TabsContent>

            <TabsContent value="orders" className="space-y-4 mt-0 focus-visible:outline-none">
              {hubTab === "orders" && (
                <OrdersView facilities={[facility]} embedded lockedFacilityId={facility.id} />
              )}
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
