import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
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
  searchAllProducts,
  type ProductItemResponse,
  type ProductStatus,
} from "@/api/product";
import { ApiErrorState } from "@/components/errors";
import { ADMIN_PRODUCT_STATUS_LABELS, productStatusBadgeVariant } from "./admin-shared";

const PAGE_SIZE = 15;
const DEFAULT_THUMB =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=480&h=480&fit=crop";

const PRODUCT_STATUSES: ProductStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

export function ProductsView() {
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [status, setStatus] = useState<"ALL" | ProductStatus>("ALL");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<ProductItemResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [hasMore, setHasMore] = useState(false);

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
        const data = await searchAllProducts({
          page,
          pageSize: PAGE_SIZE,
          keyword: debouncedKeyword || undefined,
          status: status === "ALL" ? undefined : status,
          sortBy: "UPDATED_AT_DESC",
        });
        if (!cancelled) {
          setRows(data);
          setHasMore(data.length >= PAGE_SIZE);
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

  if (error) {
    return <ApiErrorState error={error} variant="embedded" />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-display font-bold">Sản phẩm</h1>
        <p className="text-sm text-muted-foreground mt-1">Danh sách sản phẩm trên toàn hệ thống (chỉ xem).</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên sản phẩm…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as "ALL" | ProductStatus)}>
          <SelectTrigger className="w-[180px] rounded-xl">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
            {PRODUCT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {ADMIN_PRODUCT_STATUS_LABELS[s]}
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
          <div className="py-16 text-center text-sm text-muted-foreground">Không tìm thấy sản phẩm.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[72px]">Ảnh</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Biến thể</TableHead>
                <TableHead>Trạng thái</TableHead>
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
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.primarySubCategoryName ?? "—"}
                  </TableCell>
                  <TableCell>{row.variantCount}</TableCell>
                  <TableCell>
                    <Badge variant={productStatusBadgeVariant(row.status)}>
                      {ADMIN_PRODUCT_STATUS_LABELS[row.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {(page > 0 || hasMore) && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Trang {page + 1}</span>
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
              disabled={!hasMore || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
