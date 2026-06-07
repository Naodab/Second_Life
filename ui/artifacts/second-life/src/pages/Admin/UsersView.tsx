import { useEffect, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Loader2, Search } from "lucide-react";
import { useLocation } from "wouter";
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
import type { AdminAccountRole } from "@/api/admin";
import { ApiErrorState } from "@/components/errors";
import { useAdminUsersPage } from "./useAdminUsersPage";
import { adminUserDetailPath } from "./adminRoutes";

const PAGE_SIZE = 15;

function displayName(
  profile?: { firstName?: string | null; lastName?: string | null } | null,
  fallbackEmail?: string,
): string {
  const name = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ").trim();
  if (name) return name;
  return fallbackEmail?.split("@")[0] ?? "—";
}

function formatCreatedAt(value?: string | null): string {
  if (!value?.trim()) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "dd/MM/yyyy HH:mm", { locale: vi });
}

export function UsersView() {
  const [, setLocation] = useLocation();
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [accountRole, setAccountRole] = useState<"ALL" | AdminAccountRole>("ALL");
  const [emailVerified, setEmailVerified] = useState<"ALL" | "true" | "false">("ALL");
  const [page, setPage] = useState(0);

  const { data, isLoading, isError, error } = useAdminUsersPage(
    page,
    PAGE_SIZE,
    debouncedKeyword,
    accountRole,
    emailVerified,
  );

  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword.trim()), 350);
    return () => clearTimeout(t);
  }, [keyword]);

  useEffect(() => {
    setPage(0);
  }, [debouncedKeyword, accountRole, emailVerified]);

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  if (isError) {
    return <ApiErrorState error={error} variant="embedded" />;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-display font-bold">Người dùng</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Danh sách tài khoản đăng ký trên nền tảng.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo email…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
        <Select value={accountRole} onValueChange={(v) => setAccountRole(v as "ALL" | AdminAccountRole)}>
          <SelectTrigger className="w-[160px] rounded-xl">
            <SelectValue placeholder="Vai trò" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả vai trò</SelectItem>
            <SelectItem value="USER">Người dùng</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={emailVerified}
          onValueChange={(v) => setEmailVerified(v as "ALL" | "true" | "false")}
        >
          <SelectTrigger className="w-[180px] rounded-xl">
            <SelectValue placeholder="Email" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả email</SelectItem>
            <SelectItem value="true">Đã xác minh</SelectItem>
            <SelectItem value="false">Chưa xác minh</SelectItem>
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
          <div className="py-16 text-center text-sm text-muted-foreground">Không tìm thấy tài khoản.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Email xác minh</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Đăng ký</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setLocation(adminUserDetailPath(row.id))}
                >
                  <TableCell className="font-medium">{row.email}</TableCell>
                  <TableCell>{displayName(row.profile, row.email)}</TableCell>
                  <TableCell>
                    <Badge variant={row.role === "ADMIN" ? "default" : "secondary"}>
                      {row.role === "ADMIN" ? "Admin" : "Người dùng"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.emailVerified ? "default" : "outline"}>
                      {row.emailVerified ? "Đã xác minh" : "Chưa xác minh"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.active ? "secondary" : "destructive"}>
                      {row.active ? "Hoạt động" : "Vô hiệu"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatCreatedAt(row.createdAt)}
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
            Trang {page + 1} / {totalPages} · {totalCount} tài khoản
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
