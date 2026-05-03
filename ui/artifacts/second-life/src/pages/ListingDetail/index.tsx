import { useMemo, useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  Loader2,
  MapPin,
  ShieldCheck,
  Store,
  Calendar,
  MessageSquare,
  Package,
  Clock,
  Plus,
  Minus,
  AlertCircle,
  CheckCircle2,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/use-mock-api";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  fetchListingPublicDetail,
  searchListings,
  type ListingPublicDetailResponse,
  type AttributeDto,
  type ListingItemResponse,
} from "@/api/listing";
import type { CategoryResponse } from "@/api/categories";
import { buildFreshSearchPath } from "@/lib/search-url";
import { facilityAvatarUrl } from "@/api/facility";
import { useCategories } from "@/hooks/use-categories";
import { ListingCard } from "@/components/ListingCard";
import { ImageSlider } from "./ImageSlider";
import { StarDisplay } from "./StarDisplay";
import { ReviewMediaLightbox } from "./ReviewMediaLightbox";
import { listingDetailToCartProduct, deriveListingCartPrices } from "./cart-adapter";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=960&h=960&fit=crop";

const SIMILAR_PAGE_SIZE = 12;

function findParentCategoryId(categories: CategoryResponse[], subCategoryId: string | null): string | null {
  if (!subCategoryId?.trim()) return null;
  const sid = subCategoryId.trim();
  for (const cat of categories) {
    if (cat.items?.some((s) => s.id === sid)) return cat.id;
  }
  return null;
}

function collectImageUrls(detail: ListingPublicDetailResponse): string[] {
  const medias = detail.product.medias ?? [];
  const sorted = [...medias].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const urls = sorted
    .filter((m) => (m.mediaType ?? "IMAGE").toUpperCase() === "IMAGE" && m.mediaUrl?.trim())
    .map((m) => m.mediaUrl!.trim());
  const thumb = detail.product.thumbnailUrl?.trim();
  if (urls.length === 0 && thumb) return [thumb];
  return urls.length > 0 ? urls : [PLACEHOLDER_IMAGE];
}

function mergeVariantRows(detail: ListingPublicDetailResponse) {
  const variantById = new Map((detail.product.variants ?? []).map((v) => [v.id, v]));
  return (detail.listing.variants ?? [])
    .filter((lv) => lv.isActive !== false)
    .map((lv) => {
      const pv = variantById.get(lv.productVariantId);
      return { lv, pv };
    });
}

function attributesWithDistinctValues(attributes: AttributeDto[] | undefined | null): AttributeDto[] {
  if (!attributes?.length) return [];
  return attributes.filter((a) => {
    const vals = (a.attributeValues ?? []).filter((v) => (v.value ?? "").trim().length > 0);
    return vals.length > 0;
  });
}

export default function ListingDetail() {
  const [, params] = useRoute("/listing/:id");
  const listingId = params?.id ?? "";

  const { data, isLoading, error } = useQuery({
    queryKey: ["listingPublicDetail", listingId],
    queryFn: () => fetchListingPublicDetail(listingId),
    enabled: Boolean(listingId),
  });

  const { data: categoriesData } = useCategories();

  const subId = data?.product.primarySubCategory?.id ?? null;

  const categoryIdForSimilar = useMemo(
    () => findParentCategoryId(categoriesData, subId),
    [categoriesData, subId],
  );

  const similarSearchKey = useMemo(() => {
    if (!data) return null;
    const kw = (data.product.name ?? "").trim();
    const f = data.product.facility;
    return {
      keyword: kw.length >= 2 ? kw.slice(0, 200) : null,
      provinceCode: f?.provinceCode?.trim() || null,
      wardCode: f?.wardCode?.trim() || null,
      listingType: data.listing.listingType,
      categoryIds: categoryIdForSimilar ? [categoryIdForSimilar] : null,
      subCategoryIds: categoryIdForSimilar ? null : subId ? [subId] : null,
    };
  }, [data, categoryIdForSimilar, subId]);

  const similarInfinite = useInfiniteQuery({
    queryKey: [
      "listingSimilarInfinite",
      listingId,
      similarSearchKey?.keyword ?? "",
      similarSearchKey?.provinceCode ?? "",
      similarSearchKey?.wardCode ?? "",
      similarSearchKey?.listingType ?? "",
      (similarSearchKey?.categoryIds ?? []).join(","),
      (similarSearchKey?.subCategoryIds ?? []).join(","),
    ],
    initialPageParam: 0,
    enabled: Boolean(listingId && data && similarSearchKey),
    queryFn: async ({ pageParam }) => {
      const base = similarSearchKey!;
      const res = await searchListings({
        keyword: base.keyword,
        provinceCode: base.provinceCode,
        wardCode: base.wardCode,
        listingType: base.listingType,
        categoryIds: base.categoryIds,
        subCategoryIds: base.subCategoryIds,
        sortBy: base.keyword ? "RELEVANCE" : "UPDATED_AT_DESC",
        page: pageParam,
        pageSize: SIMILAR_PAGE_SIZE,
      });
      const rawItems = Array.isArray(res.items) ? res.items : [];
      const totalCount = typeof res.totalCount === "number" ? res.totalCount : Number(res.totalCount) || 0;
      const items = rawItems.filter((r) => r.id !== listingId);
      return { items, totalCount };
    },
    getNextPageParam: (lastPage, _pages, lastParam) =>
      (lastParam + 1) * SIMILAR_PAGE_SIZE < lastPage.totalCount ? lastParam + 1 : undefined,
  });

  const similarItems = useMemo(() => {
    const dedup = new Map<string, ListingItemResponse>();
    for (const page of similarInfinite.data?.pages ?? []) {
      for (const row of page.items) dedup.set(row.id, row);
    }
    return [...dedup.values()];
  }, [similarInfinite.data?.pages]);

  const showSimilarBlock = Boolean(data && similarSearchKey);

  const images = useMemo(() => (data ? collectImageUrls(data) : []), [data]);
  const rows = useMemo(() => (data ? mergeVariantRows(data) : []), [data]);

  const specAttributes = useMemo(
    () => (data?.product.attributes ? attributesWithDistinctValues(data.product.attributes) : []),
    [data],
  );

  const totalStock = useMemo(
    () =>
      rows.reduce((s, { pv }) => {
        const q = pv?.quantity;
        return s + (typeof q === "number" && Number.isFinite(q) ? q : 0);
      }, 0),
    [rows],
  );

  const locationLine = useMemo(() => {
    if (!data?.product.facility) return "";
    const f = data.product.facility;
    return [f.address, f.wardCode, f.provinceCode].filter(Boolean).join(", ");
  }, [data]);

  const { buyPrice, rentPrice } = useMemo(() => (data ? deriveListingCartPrices(data) : { buyPrice: 0, rentPrice: 0 }), [data]);

  const cartBridge = useMemo(() => {
    if (!data || !listingId) return null;
    return listingDetailToCartProduct(data, {
      images,
      buyPrice,
      rentPrice,
      stock: totalStock,
      location: locationLine || "—",
    });
  }, [data, listingId, images, buyPrice, rentPrice, totalStock, locationLine]);

  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [buyQty, setBuyQty] = useState(1);
  const [rentStartDate, setRentStartDate] = useState("");
  const [rentEndDate, setRentEndDate] = useState("");
  const [rentQty, setRentQty] = useState(1);
  const [rentError, setRentError] = useState<string | null>(null);
  const [rentValid, setRentValid] = useState(false);
  const [reviewLightbox, setReviewLightbox] = useState<{ media: string[]; idx: number } | null>(null);

  const { addToCart } = useCart();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const reviews: { id: string; userName: string; userAvatar: string; rating: number; comment: string; date: string; images?: string[]; videos?: string[] }[] = [];

  const handleCheckoutNow = (mode: "buy" | "rent") => {
    if (!cartBridge) return;
    addToCart(
      cartBridge,
      mode === "buy" ? buyQty : rentQty,
      mode === "rent" && rentStartDate && rentEndDate
        ? { start: new Date(rentStartDate), end: new Date(rentEndDate) }
        : undefined,
    );
    setIsBuyModalOpen(false);
    setIsRentModalOpen(false);
    setRentError(null);
    setRentValid(false);
    navigate("/checkout");
  };

  const handleQuickAddToCart = () => {
    if (!cartBridge) return;
    addToCart(cartBridge, 1);
    toast({ title: "Đã thêm vào giỏ hàng!", description: `${cartBridge.name} đã được thêm vào giỏ.` });
  };

  const handleRentCheck = () => {
    setRentError(null);
    setRentValid(false);
    if (!rentStartDate || !rentEndDate) {
      setRentError("Vui lòng chọn ngày bắt đầu và kết thúc.");
      return;
    }
    const start = new Date(rentStartDate);
    const end = new Date(rentEndDate);
    if (end <= start) {
      setRentError("Ngày kết thúc phải sau ngày bắt đầu.");
      return;
    }
    if (rentQty > totalStock && totalStock > 0) {
      setRentError(`Chỉ còn ${totalStock} trong kho.`);
      return;
    }
    setRentValid(true);
  };

  const rentDays =
    rentStartDate && rentEndDate
      ? Math.max(0, Math.ceil((new Date(rentEndDate).getTime() - new Date(rentStartDate).getTime()) / 86400000))
      : 0;

  if (isLoading || !listingId) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-4">
            <Skeleton className="aspect-square rounded-3xl" />
            <div className="flex gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-20 h-20 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-7 space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-14 w-full rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data || !cartBridge) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-lg font-semibold text-muted-foreground">
        Không tìm thấy tin đăng hoặc đã ngừng hiển thị.
      </div>
    );
  }

  const { listing, product } = data;
  const facility = product.facility;
  const subName = product.primarySubCategory?.name ?? "Danh mục";
  const conditionLabel = listing.listingType === "RENT" ? "Cho thuê" : "Đăng bán";

  const avgRating =
    facility?.averageRating != null && facility.averageRating > 0
      ? Number(facility.averageRating)
      : cartBridge.rating;

  const priceBandLabel = (): string | null => {
    const min = listing.minPrice ?? null;
    const max = listing.maxPrice ?? null;
    if (min != null && max != null) {
      return min === max ? formatCurrency(min) : `${formatCurrency(min)} – ${formatCurrency(max)}`;
    }
    if (min != null) return formatCurrency(min);
    if (max != null) return formatCurrency(max);
    return null;
  };

  const band = priceBandLabel();
  const outOfStock = totalStock <= 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-sm text-muted-foreground flex flex-wrap gap-2">
          <Link href="/" className="hover:text-primary">
            Trang chủ
          </Link>
          <span>/</span>
          <Link href={buildFreshSearchPath(subId ? { "subCategoryIds[]": [subId] } : {})} className="hover:text-primary">
            {subName}
          </Link>
          <span>/</span>
          <span className="text-foreground truncate max-w-[220px] sm:max-w-[320px]">{listing.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <ImageSlider images={images} productName={listing.title} />
          </div>

          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-card rounded-3xl border border-border p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                  {subName}
                </Badge>
                <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                  {conditionLabel}
                </Badge>
              </div>

              <h1 className="text-3xl font-display font-bold text-foreground mb-4 leading-tight">{listing.title}</h1>

              <p className="text-muted-foreground leading-relaxed mb-6 whitespace-pre-line text-sm">
                {(listing.description ?? "").trim() || product.description?.trim() || "Không có mô tả thêm."}
              </p>

              {band || buyPrice > 0 || rentPrice > 0 ? (
                <div className="mb-8 rounded-2xl border border-primary/20 bg-primary/5 dark:bg-primary/15 px-5 py-5 sm:px-6">
                  <p className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tabular-nums leading-tight text-primary">
                    {band ?? (listing.listingType === "RENT" ? `${formatCurrency(rentPrice)} / ngày` : formatCurrency(buyPrice))}
                  </p>
                </div>
              ) : null}

              {specAttributes.length > 0 ? (
                <div className="mb-8 rounded-2xl border border-border bg-muted/20 px-5 py-4">
                  <h3 className="text-sm font-bold text-foreground mb-3">Đặc điểm theo phiên bản</h3>
                  <dl className="space-y-2 text-sm">
                    {specAttributes.map((attr, idx) => (
                      <div key={`${attr.id ?? attr.name}-${idx}`} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                        <dt className="font-semibold text-foreground shrink-0 min-w-[7rem]">{attr.name ?? "Thuộc tính"}</dt>
                        <dd className="text-muted-foreground">
                          {(attr.attributeValues ?? [])
                            .map((v) => (v.value ?? "").trim())
                            .filter(Boolean)
                            .join(", ")}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : null}

              <div className="flex items-center gap-4 text-sm mb-6 pb-6 border-b border-border flex-wrap">
                <div className="flex items-center gap-2">
                  <StarDisplay rating={avgRating} size="md" />
                  <span className="font-semibold">{avgRating.toFixed(1)}</span>
                  <span className="text-muted-foreground">
                    ({reviews.length > 0 ? `${reviews.length} đánh giá` : "cơ sở"})
                  </span>
                </div>
                <span className="text-muted-foreground hidden sm:inline">•</span>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Package className="w-4 h-4" />
                  <span>
                    Còn lại: <strong className="text-foreground">{outOfStock ? "—" : totalStock}</strong>
                  </span>
                </div>
                <span className="text-muted-foreground hidden sm:inline">•</span>
                <div className="flex items-center gap-1 text-muted-foreground min-w-0">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="truncate max-w-[220px] sm:max-w-none">{locationLine || "—"}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {listing.listingType === "RENT" && (
                  <Button
                    size="lg"
                    variant="outline"
                    disabled={outOfStock}
                    className="flex-1 rounded-full h-12 border-2 border-secondary text-secondary-foreground hover:bg-secondary/10"
                    onClick={() => {
                      setIsRentModalOpen(true);
                      setRentError(null);
                      setRentValid(false);
                    }}
                  >
                    <Calendar className="w-4 h-4 mr-2" /> Thuê ngay
                  </Button>
                )}
                {listing.listingType === "BUY" && (
                  <Button
                    size="lg"
                    disabled={outOfStock}
                    className="flex-1 rounded-full h-12 shadow-lg shadow-primary/20"
                    onClick={() => setIsBuyModalOpen(true)}
                  >
                    Mua ngay
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="outline"
                  disabled={outOfStock}
                  className="flex-1 rounded-full h-12"
                  onClick={handleQuickAddToCart}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" /> Thêm vào giỏ
                </Button>
              </div>
            </div>
          </div>
        </div>

        {facility?.id ? (
          <div className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 flex-1 gap-4">
                <img
                  src={facilityAvatarUrl({ imageUrl: facility.imageUrl ?? undefined })}
                  alt={facility.name ?? ""}
                  className="h-16 w-16 shrink-0 rounded-full border-2 border-primary/20 object-cover sm:h-20 sm:w-20"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-lg font-bold text-foreground">
                    <span>{facility.name ?? "Cơ sở"}</span>
                    {facility.orderCount != null && facility.orderCount > 50 ? (
                      <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
                    ) : null}
                  </div>
                  {(facility.address || facility.wardCode || facility.provinceCode) ? (
                    <div className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{[facility.address, facility.wardCode, facility.provinceCode].filter(Boolean).join(", ")}</span>
                    </div>
                  ) : null}
                  <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      <span>
                        <strong className="text-foreground">{facility.orderCount ?? 0}</strong> đơn đã hoàn thành (ước tính)
                      </span>
                    </div>
                    <span className="hidden sm:inline">•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>Luôn cập nhật trên Second Life</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-3 lg:items-start">
                <Link href="/messages">
                  <Button variant="outline" size="default" className="rounded-full">
                    <MessageSquare className="mr-2 h-4 w-4" /> Chat ngay
                  </Button>
                </Link>
                <Link href={`/facility/${encodeURIComponent(facility.id)}`}>
                  <Button className="rounded-full border-0 bg-primary/10 text-primary shadow-none hover:bg-primary/20">
                    <Store className="mr-2 h-4 w-4" /> Xem cơ sở
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-12 bg-card rounded-3xl border border-border p-8 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center mb-8">
            <div>
              <h2 className="text-2xl font-display font-bold">Đánh giá tin đăng</h2>
              <p className="text-muted-foreground text-sm mt-1">Phần đánh giá chi tiết theo đơn sẽ được đồng bộ sau</p>
            </div>
            <div className="sm:ml-auto flex items-center gap-3 rounded-2xl border border-amber-500/35 bg-amber-500/10 px-5 py-3 dark:border-amber-400/30 dark:bg-amber-950/50">
              <span className="text-4xl font-bold text-amber-600 dark:text-amber-400">{avgRating.toFixed(1)}</span>
              <div>
                <StarDisplay rating={avgRating} size="md" />
                <p className="text-xs text-muted-foreground mt-1">Điểm cơ sở</p>
              </div>
            </div>
          </div>

          {reviews.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-10 border border-dashed rounded-2xl">
              Chưa có đánh giá cụ thể cho tin đăng này.
            </p>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => {
                const allMedia = [...(review.images ?? []), ...(review.videos ?? [])];
                return (
                  <div key={review.id} className="pb-6 border-b last:border-0 last:pb-0">
                    <div className="flex items-center gap-3 mb-3">
                      <img src={review.userAvatar} className="w-10 h-10 rounded-full object-cover border" alt={review.userName} />
                      <div>
                        <h4 className="font-semibold text-sm">{review.userName}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <StarDisplay rating={review.rating} />
                          <span className="text-xs text-muted-foreground">{review.date}</span>
                        </div>
                      </div>
                    </div>
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 mb-3 pl-[3.25rem] flex-wrap">
                        {review.images.map((img, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setReviewLightbox({ media: allMedia, idx: i })}
                            className="w-20 h-20 rounded-xl overflow-hidden border hover:opacity-90 transition-opacity flex-shrink-0"
                          >
                            <img src={img} alt="Ảnh review" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="text-muted-foreground text-sm pl-[3.25rem]">{review.comment}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {showSimilarBlock ? (
          <div className="mt-12">
            <h2 className="text-2xl font-display font-bold mb-2">Tin đăng tương tự</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Gợi ý theo danh mục, tên sản phẩm và khu vực của tin đang xem (cùng{" "}
              {listing.listingType === "RENT" ? "hình thức thuê" : "hình thức bán"}
              ).
            </p>

            {similarInfinite.isPending ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: SIMILAR_PAGE_SIZE }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[3/5] rounded-3xl" />
                ))}
              </div>
            ) : similarItems.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {similarItems.map((row) => (
                    <ListingCard key={row.id} row={row} />
                  ))}
                </div>
                {similarInfinite.hasNextPage ? (
                  <div className="mt-8 flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="rounded-full px-10"
                      disabled={similarInfinite.isFetchingNextPage}
                      onClick={() => similarInfinite.fetchNextPage()}
                    >
                      {similarInfinite.isFetchingNextPage ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang tải…
                        </>
                      ) : (
                        "Tải thêm"
                      )}
                    </Button>
                  </div>
                ) : null}
              </>
            ) : similarInfinite.isError ? (
              <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                Không tải được gợi ý — thử làm mới trang hoặc tìm từ mục tìm kiếm.
              </p>
            ) : (
              <p className="rounded-2xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                Chưa có tin tương tự trong cùng danh mục và khu vực — bạn có thể mở tìm kiếm và nới điều kiện lọc.
              </p>
            )}
          </div>
        ) : null}
      </div>

      <Dialog open={isBuyModalOpen} onOpenChange={setIsBuyModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Mua ngay</DialogTitle>
            <DialogDescription className="sr-only">Chọn số lượng và xác nhận mua</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b">
              <img src={images[0]} className="w-20 h-20 rounded-xl object-cover border" alt={cartBridge.name} />
              <div>
                <h4 className="font-bold line-clamp-2">{cartBridge.name}</h4>
                <p className="text-primary font-bold text-xl mt-1">{formatCurrency(buyPrice)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Số lượng</span>
              <div className="flex items-center gap-3 border rounded-xl px-2 py-1">
                <button
                  type="button"
                  onClick={() => setBuyQty((q) => Math.max(1, q - 1))}
                  className="p-1 rounded-lg hover:bg-accent"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-bold w-8 text-center">{buyQty}</span>
                <button
                  type="button"
                  onClick={() => setBuyQty((q) => Math.min(totalStock > 0 ? totalStock : 1, q + 1))}
                  disabled={totalStock <= 1}
                  className="p-1 rounded-lg hover:bg-accent disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="mt-4 bg-muted rounded-xl p-3 flex justify-between text-sm">
              <span className="text-muted-foreground">Tổng cộng</span>
              <span className="font-bold text-primary text-base">{formatCurrency(buyPrice * buyQty)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBuyModalOpen(false)} className="rounded-full">
              Hủy
            </Button>
            <Button onClick={() => handleCheckoutNow("buy")} className="rounded-full px-8" disabled={outOfStock}>
              Mua ngay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isRentModalOpen}
        onOpenChange={(v) => {
          setIsRentModalOpen(v);
          if (!v) {
            setRentError(null);
            setRentValid(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Thuê ngay</DialogTitle>
            <DialogDescription className="sr-only">Chọn ngày thuê và xác nhận</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-4 mb-5 pb-5 border-b">
              <img src={images[0]} className="w-16 h-16 rounded-xl object-cover border" alt={cartBridge.name} />
              <div>
                <h4 className="font-bold line-clamp-2">{cartBridge.name}</h4>
                <p className="text-secondary-foreground font-semibold mt-1">
                  {formatCurrency(rentPrice)} <span className="text-xs font-normal text-muted-foreground">/ ngày (ước tính)</span>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Ngày bắt đầu</label>
                  <Input
                    type="date"
                    value={rentStartDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => {
                      setRentStartDate(e.target.value);
                      setRentValid(false);
                      setRentError(null);
                    }}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Ngày kết thúc</label>
                  <Input
                    type="date"
                    value={rentEndDate}
                    min={rentStartDate || new Date().toISOString().split("T")[0]}
                    onChange={(e) => {
                      setRentEndDate(e.target.value);
                      setRentValid(false);
                      setRentError(null);
                    }}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">Số lượng</span>
                <div className="flex items-center gap-3 border rounded-xl px-2 py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setRentQty((q) => Math.max(1, q - 1));
                      setRentValid(false);
                      setRentError(null);
                    }}
                    className="p-1 rounded-lg hover:bg-accent"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold w-8 text-center">{rentQty}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const cap = totalStock > 0 ? totalStock : 99;
                      setRentQty((q) => Math.min(cap, q + 1));
                      setRentValid(false);
                      setRentError(null);
                    }}
                    disabled={totalStock > 0 && rentQty >= totalStock}
                    className="p-1 rounded-lg hover:bg-accent disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {rentDays > 0 && (
                <div className="bg-muted rounded-xl p-3 text-sm">
                  <div className="flex justify-between text-muted-foreground mb-1">
                    <span>Thời gian thuê</span>
                    <span className="font-medium text-foreground">{rentDays} ngày</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tổng dự kiến</span>
                    <span className="font-bold text-primary">{formatCurrency(rentPrice * rentDays * rentQty)}</span>
                  </div>
                </div>
              )}

              {rentError && (
                <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl p-3 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{rentError}</span>
                </div>
              )}

              {rentValid && (
                <div className="flex items-start gap-2 rounded-xl border border-green-600/35 bg-green-600/10 p-3 text-sm text-green-800 dark:border-green-500/40 dark:bg-green-950/50 dark:text-green-300">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Thời gian và số lượng hợp lệ! Bạn có thể thêm vào giỏ.</span>
                </div>
              )}

              {!rentValid ? (
                <Button onClick={handleRentCheck} disabled={!rentStartDate || !rentEndDate} variant="outline" className="w-full rounded-xl" size="sm">
                  Kiểm tra thời gian
                </Button>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRentModalOpen(false)} className="rounded-full">
              Hủy
            </Button>
            <Button
              onClick={() => handleCheckoutNow("rent")}
              disabled={!rentValid || outOfStock}
              className="rounded-full px-8 bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              Thuê ngay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {reviewLightbox ? (
        <ReviewMediaLightbox media={reviewLightbox.media} startIdx={reviewLightbox.idx} onClose={() => setReviewLightbox(null)} />
      ) : null}
    </div>
  );
}
