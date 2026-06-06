import { useEffect, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiErrorState } from "@/components/errors";
import { ORDER_STATUS_LABELS } from "@/pages/Orders/useMyOrdersPage";
import { formatAdminPrice } from "./admin-shared";
import { useAdminOrdersPage, type AdminOrderKind } from "./useAdminOrdersPage";

const PAGE_SIZE = 15;

const BUY_STATUSES = ["ALL", "PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
const RENT_STATUSES = ["ALL", "PENDING", "CONFIRMED", "DELIVERED", "RETURNED", "COMPLETED", "CANCELLED"] as const;

function formatDateTime(value?: string | null): string {
  if (!value?.trim()) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "dd/MM/yyyy HH:mm", { locale: vi });
}

function customerName(customer?: { firstName?: string | null; lastName?: string | null; email?: string | null }) {
  const name = [customer?.firstName, customer?.lastName].filter(Boolean).join(" ").trim();
  return name || customer?.email || "—";
}

export function OrdersView() {
  const [kind, setKind] = useState<AdminOrderKind>("buy");
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(0);

  const { items, totalCount, isLoading, isError, error } = useAdminOrdersPage(
    kind,
    page,
    PAGE_SIZE,
    status,
  );

  useEffect(() => {
    setPage(0);
    setStatus("ALL");
  }, [kind]);

  useEffect(() => {
    setPage(0);
  }, [status]);

  const statusOptions = kind === "buy" ? BUY_STATUSES : RENT_STATUSES;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  if (isError) {
    return <ApiErrorState error={error} variant="embedded" />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-display font-bold">Đơn hàng</h1>
        <p className="text-sm text-muted-foreground mt-1">Xem toàn bộ đơn mua và đơn thuê trên nền tảng.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={kind} onValueChange={(v) => setKind(v as AdminOrderKind)}>
          <TabsList className="rounded-xl">
            <TabsTrigger value="buy" className="rounded-lg">
              Đơn mua
            </TabsTrigger>
            <TabsTrigger value="rent" className="rounded-lg">
              Đơn thuê
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[200px] rounded-xl">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "ALL" ? "Tất cả trạng thái" : ORDER_STATUS_LABELS[s as keyof typeof ORDER_STATUS_LABELS]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang tải…
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Không có đơn hàng.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã đơn</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Biến thể</TableHead>
                <TableHead>Số lượng</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">{row.id}</TableCell>
                  <TableCell className="text-sm">{customerName(row.customer ?? undefined)}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {row.listingVariantId}
                  </TableCell>
                  <TableCell>{row.quantity}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatAdminPrice(row.price ?? null, row.price ?? null)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {ORDER_STATUS_LABELS[row.status as keyof typeof ORDER_STATUS_LABELS] ?? row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDateTime(row.createdAt)}
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
            Trang {page + 1} / {totalPages} · {totalCount} đơn
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
    </div>
  );
}
