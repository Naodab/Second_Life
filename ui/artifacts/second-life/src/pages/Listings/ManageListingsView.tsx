import { useEffect, useState } from "react";
import { ExternalLink, FileText, Loader2, Plus, Search, ShoppingBag, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  getFacilityListingPage,
  MANAGE_LISTING_STATUSES,
  type ListingItemResponse,
  type ListingStatus,
  type ListingType,
} from "@/api/listing";
import type { FacilityWithPlaceNames } from "@/api/facility";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

const DEFAULT_THUMB = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=480&h=480&fit=crop";

const MANAGE_STATUS_LABELS: Record<ListingStatus, string> = {
  ACTIVE: "Đang đăng",
  INACTIVE: "Tạm ẩn",
  PENDING: "Chưa duyệt",
  REJECTED: "Từ chối",
};

function formatPrice(min: number | null | undefined, max: number | null | undefined): string {
  if (min == null && max == null) return "—";
  const fmt = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
  if (min != null && max != null && min !== max) return `${fmt(min)} – ${fmt(max)}`;
  if (min != null) return fmt(min);
  if (max != null) return fmt(max);
  return "—";
}

function statusConfig(s: ListingStatus): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  switch (s) {
    case "ACTIVE":
      return { label: MANAGE_STATUS_LABELS.ACTIVE, variant: "default" };
    case "INACTIVE":
      return { label: MANAGE_STATUS_LABELS.INACTIVE, variant: "secondary" };
    case "PENDING":
      return { label: MANAGE_STATUS_LABELS.PENDING, variant: "secondary" };
    case "REJECTED":
      return { label: MANAGE_STATUS_LABELS.REJECTED, variant: "destructive" };
    default:
      return { label: s, variant: "outline" };
  }
}

export function ManageListingsView({
  facilities,
  onCreateListing,
}: {
  facilities: FacilityWithPlaceNames[];
  onCreateListing: (facilityId: string, productId?: string) => void;
}) {
  const defaultFacilityId = facilities[0]?.id ?? "";

  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [facilityId, setFacilityId] = useState<string>(defaultFacilityId);
  const [status, setStatus] = useState<"ALL" | ListingStatus>("ALL");
  const [listingType, setListingType] = useState<"ALL" | ListingType>("ALL");
  const [rows, setRows] = useState<ListingItemResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!facilityId && facilities.length > 0) {
      setFacilityId(facilities[0].id);
    }
  }, [facilities, facilityId]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword.trim()), 350);
    return () => clearTimeout(t);
  }, [keyword]);

  useEffect(() => {
    setPage(0);
  }, [debouncedKeyword, facilityId, status, listingType]);

  useEffect(() => {
    if (!facilityId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await getFacilityListingPage(facilityId, {
          page,
          pageSize: PAGE_SIZE,
          keyword: debouncedKeyword || undefined,
          listingStatus: status === "ALL" ? undefined : status,
          listingType: listingType === "ALL" ? undefined : listingType,
        });
        if (!cancelled) {
          setRows(data.items ?? []);
          setTotalCount(typeof data.totalCount === "number" ? data.totalCount : 0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, debouncedKeyword, facilityId, status, listingType]);

  const createFacilityId = facilityId || defaultFacilityId;

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Bài đăng</h2>
        <Button
          disabled={!createFacilityId}
          onClick={() => onCreateListing(createFacilityId)}
          className="rounded-full shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Tạo listing mới
        </Button>
      </div>

      <div className="rounded-xl border bg-card p-4 grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="sm:col-span-2 xl:col-span-2">
          <Label className="text-xs text-muted-foreground">Tìm kiếm</Label>
          <div className="relative mt-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tiêu đề, sản phẩm…"
              className="pl-9 h-9 bg-background"
            />
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Cơ sở</Label>
          <Select value={facilityId} onValueChange={setFacilityId}>
            <SelectTrigger className="mt-1 h-9 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {facilities.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Trạng thái</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as "ALL" | ListingStatus)}>
            <SelectTrigger className="mt-1 h-9 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả</SelectItem>
              {MANAGE_LISTING_STATUSES.map((value) => (
                <SelectItem key={value} value={value}>
                  {MANAGE_STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Hình thức</Label>
          <Select value={listingType} onValueChange={(v) => setListingType(v as "ALL" | ListingType)}>
            <SelectTrigger className="mt-1 h-9 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả</SelectItem>
              <SelectItem value="BUY">Bán</SelectItem>
              <SelectItem value="RENT">Thuê</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {totalCount} listing{totalCount !== 1 ? "s" : ""}
        </span>
        {totalPages > 1 && (
          <span>
            Trang {page + 1} / {totalPages}
          </span>
        )}
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border p-12 text-center text-muted-foreground">
          <FileText className="mx-auto mb-3 w-9 h-9 opacity-30" />
          <p className="text-sm">Chưa có listing nào</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((l) => {
            const st = statusConfig(l.listingStatus);
            const thumb = l.thumbnailImage?.trim() || DEFAULT_THUMB;
            const price = formatPrice(l.minPrice, l.maxPrice);
            return (
              <div
                key={l.id}
                className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:shadow-md"
              >
                <div className="relative aspect-square overflow-hidden bg-muted">
                  <img
                    src={thumb}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
                    <Badge variant={st.variant} className="text-[10px] px-2 py-0.5 shadow-sm">
                      {st.label}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-2 py-0.5 shadow-sm bg-background/90",
                        l.listingType === "RENT"
                          ? "border-blue-300 text-blue-700"
                          : "border-emerald-300 text-emerald-700",
                      )}
                    >
                      {l.listingType === "RENT" ? (
                        <>
                          <Calendar className="w-2.5 h-2.5 mr-1 inline" />
                          Thuê
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-2.5 h-2.5 mr-1 inline" />
                          Bán
                        </>
                      )}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-col flex-1 p-3 gap-1.5">
                  <p className="font-semibold text-sm line-clamp-2 leading-snug">{l.title}</p>
                  {l.productName && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{l.productName}</p>
                  )}
                  {l.facilityName && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{l.facilityName}</p>
                  )}
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mt-auto pt-1">
                    {price}
                  </p>
                </div>

                <div className="px-3 pb-3">
                  <a
                    href={`/listing/${l.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-emerald-300 bg-background px-3 py-2 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Xem listing
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && totalCount > 0 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Trước
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  );
}
