import { useEffect, useState } from "react";
import { ExternalLink, Loader2, Search } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MANAGE_LISTING_STATUSES,
  searchListings,
  type ListingItemResponse,
  type ListingStatus,
} from "@/api/listing";
import { ApiErrorState } from "@/components/errors";
import {
  ADMIN_LISTING_STATUS_LABELS,
  formatAdminPrice,
  listingStatusBadgeVariant,
} from "./admin-shared";

const PAGE_SIZE = 12;
const DEFAULT_THUMB =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=480&h=480&fit=crop";

export function AllListingsView() {
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [status, setStatus] = useState<"ALL" | ListingStatus>("ALL");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<ListingItemResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword.trim()), 350);
    return () => clearTimeout(t);
  }, [keyword]);

  useEffect(() => {
    setPage(0);
  }, [debouncedKeyword, status]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await searchListings({
          page,
          pageSize: PAGE_SIZE,
          keyword: debouncedKeyword || undefined,
          listingStatus: status === "ALL" ? undefined : status,
          sortBy: "UPDATED_AT_DESC",
        });
        if (!cancelled) {
          setRows(data.items ?? []);
          setTotalCount(typeof data.totalCount === "number" ? data.totalCount : 0);
        }
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, debouncedKeyword, status]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  if (error) {
    return <ApiErrorState error={error} variant="embedded" />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-display font-bold">Tất cả bài đăng</h1>
        <p className="text-sm text-muted-foreground mt-1">Xem danh sách bài đăng trên toàn hệ thống.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tiêu đề…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as "ALL" | ListingStatus)}>
          <SelectTrigger className="w-[180px] rounded-xl">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
            {MANAGE_LISTING_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {ADMIN_LISTING_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang tải…
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Không tìm thấy bài đăng.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[72px]">Ảnh</TableHead>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Cơ sở</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead className="text-right">Xem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <img
                      src={row.thumbnailImage?.trim() || DEFAULT_THUMB}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium line-clamp-2">{row.title}</div>
                    <div className="text-xs text-muted-foreground">{row.listingType === "RENT" ? "Cho thuê" : "Bán"}</div>
                  </TableCell>
                  <TableCell className="text-sm">{row.facilityName ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={listingStatusBadgeVariant(row.listingStatus)}>
                      {ADMIN_LISTING_STATUS_LABELS[row.listingStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatAdminPrice(row.minPrice, row.maxPrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/listing/${row.id}`} target="_blank">
                      <Button type="button" variant="ghost" size="sm" className="rounded-lg">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {totalCount > PAGE_SIZE ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Trang {page + 1} / {totalPages} · {totalCount} bài
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg"
              disabled={page <= 0 || loading}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Trước
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg"
              disabled={page >= totalPages - 1 || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
