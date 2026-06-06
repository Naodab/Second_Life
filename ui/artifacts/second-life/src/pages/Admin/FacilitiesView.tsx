import { useEffect, useState } from "react";
import { ExternalLink, Loader2, Search } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { facilityAvatarUrl, searchAllFacilities, type FacilityResponse } from "@/api/facility";
import { ApiErrorState } from "@/components/errors";

const PAGE_SIZE = 15;

export function FacilitiesView() {
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<FacilityResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword.trim()), 350);
    return () => clearTimeout(t);
  }, [keyword]);

  useEffect(() => {
    setPage(0);
  }, [debouncedKeyword]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await searchAllFacilities({
          page,
          pageSize: PAGE_SIZE,
          name: debouncedKeyword || undefined,
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
  }, [page, debouncedKeyword]);

  if (error) {
    return <ApiErrorState error={error} variant="embedded" />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-display font-bold">Cơ sở</h1>
        <p className="text-sm text-muted-foreground mt-1">Danh sách cơ sở trên toàn hệ thống (chỉ xem).</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Tìm theo tên cơ sở…"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="pl-9 rounded-xl"
        />
      </div>

      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang tải…
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Không tìm thấy cơ sở.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[56px]">Ảnh</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Địa chỉ</TableHead>
                <TableHead>Chủ sở hữu</TableHead>
                <TableHead className="text-right">Xem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <img
                      src={facilityAvatarUrl(row)}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {row.address || "—"}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground">{row.ownerId}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/facility/${row.id}`} target="_blank">
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
