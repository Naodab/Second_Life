import type { ReactNode } from "react";
import {
  Building2,
  ClipboardCheck,
  FileText,
  LogOut,
  Package,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  adminFacilitiesPath,
  adminListingsPath,
  adminListingsPendingPath,
  adminOrdersPath,
  adminProductsPath,
  adminRouteActive,
  adminUsersPath,
  type AdminRouteParsed,
} from "./adminRoutes";

export function AdminSidebar({ route, onGoHome }: { route: AdminRouteParsed | null; onGoHome: () => void }) {
  const { logout } = useAuth();

  function navLink(label: string, icon: ReactNode, href: string, active: boolean) {
    return (
      <Link
        href={href}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left",
          active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
        )}
      >
        {icon} {label}
      </Link>
    );
  }

  return (
    <aside className="sticky top-0 flex h-screen w-60 flex-shrink-0 flex-col border-r border-border bg-card shadow-sm">
      <div className="p-4 border-b flex items-center gap-2">
        <div className="bg-primary/20 p-1.5 rounded-lg">
          <img
            src={`${import.meta.env.BASE_URL}favicon.png`}
            alt="Logo"
            className="w-5 h-5 object-contain"
          />
        </div>
        <span className="font-display font-bold text-base leading-tight">Quản trị</span>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Bài đăng
        </p>
        {navLink(
          "Chờ duyệt",
          <ClipboardCheck className="w-4 h-4" />,
          adminListingsPendingPath(),
          adminRouteActive(route, "listings-pending"),
        )}
        {navLink(
          "Tất cả bài đăng",
          <FileText className="w-4 h-4" />,
          adminListingsPath(),
          adminRouteActive(route, "listings"),
        )}

        <p className="px-3 pt-4 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Danh mục
        </p>
        {navLink(
          "Sản phẩm",
          <Package className="w-4 h-4" />,
          adminProductsPath(),
          adminRouteActive(route, "products"),
        )}
        {navLink(
          "Cơ sở",
          <Building2 className="w-4 h-4" />,
          adminFacilitiesPath(),
          adminRouteActive(route, "facilities"),
        )}

        <p className="px-3 pt-4 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Vận hành
        </p>
        {navLink(
          "Người dùng",
          <Users className="w-4 h-4" />,
          adminUsersPath(),
          adminRouteActive(route, "users"),
        )}
        {navLink(
          "Đơn hàng",
          <ShoppingBag className="w-4 h-4" />,
          adminOrdersPath(),
          adminRouteActive(route, "orders"),
        )}
      </nav>

      <div className="p-3 border-t space-y-1">
        <button
          type="button"
          onClick={onGoHome}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted/80 hover:text-foreground"
        >
          <Store className="w-4 h-4" /> Về trang chợ
        </button>
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all"
        >
          <LogOut className="w-4 h-4" /> Đăng xuất
        </button>
      </div>
    </aside>
  );
}
