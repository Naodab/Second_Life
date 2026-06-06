import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ApiErrorState } from "@/components/errors";
import { formatAdminPrice } from "./admin-shared";
import { usePendingListingsPage } from "./usePendingListingsPage";

const PAGE_SIZE = 10;
const DEFAULT_THUMB =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=480&h=480&fit=crop";

type PendingAction = { id: string; type: "approve" | "reject" };

export function PendingListingsView() {
  const [page, setPage] = useState(0);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const { items, totalCount, isLoading, isError, error, approve, reject, actingId, isActing } =
    usePendingListingsPage(page, PAGE_SIZE);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  function confirmAction() {
    if (!pendingAction) return;
    if (pendingAction.type === "approve") {
      approve(pendingAction.id);
    } else {
      reject(pendingAction.id);
    }
    setPendingAction(null);
  }

  if (isError) {
    return <ApiErrorState error={error} onRetry={() => window.location.reload()} variant="embedded" />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-display font-bold">Duyệt bài đăng</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Các bài đăng đang chờ phê duyệt trước khi hiển thị trên chợ.
        </p>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang tải danh sách…
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Không có bài đăng nào đang chờ duyệt.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[72px]">Ảnh</TableHead>
                <TableHead>Bài đăng</TableHead>
                <TableHead>Cơ sở</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => {
                const busy = isActing && actingId === row.id;
                return (
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
                      <div className="text-xs text-muted-foreground mt-0.5">{row.productName ?? "—"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{row.facilityName ?? "—"}</div>
                      {row.facilityAddress ? (
                        <div className="text-xs text-muted-foreground line-clamp-1">{row.facilityAddress}</div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{row.listingType === "RENT" ? "Cho thuê" : "Bán"}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatAdminPrice(row.minPrice, row.maxPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/listing/${row.id}`} target="_blank">
                          <Button type="button" variant="ghost" size="sm" className="rounded-lg">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-lg"
                          disabled={busy}
                          onClick={() => setPendingAction({ id: row.id, type: "reject" })}
                        >
                          Từ chối
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="rounded-lg"
                          disabled={busy}
                          onClick={() => setPendingAction({ id: row.id, type: "approve" })}
                        >
                          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Duyệt"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
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
              disabled={page <= 0 || isLoading}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Trước
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg"
              disabled={page >= totalPages - 1 || isLoading}
              onClick={() => setPage((p) => p + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      ) : null}

      <AlertDialog open={pendingAction != null} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.type === "approve" ? "Duyệt bài đăng?" : "Từ chối bài đăng?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.type === "approve"
                ? "Bài đăng sẽ được hiển thị công khai trên chợ sau khi duyệt."
                : "Bài đăng sẽ bị từ chối và không hiển thị trên chợ."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Hủy</AlertDialogCancel>
            <AlertDialogAction className="rounded-full" onClick={confirmAction}>
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
