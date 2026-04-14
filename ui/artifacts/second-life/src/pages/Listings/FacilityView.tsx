import { useRef, useState } from "react";
import {
  Plus,
  Store,
  ShieldCheck,
  MapPin,
  Star,
  Package,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MOCK_PRODUCTS, type Shop } from "@/lib/mock-data";
import { formatCurrency, cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export function FacilityView({
  shop,
  onViewProduct,
  onAddProduct,
  onViewUnpublished,
  pendingCount,
}: {
  shop: Shop;
  onViewProduct: (id: string) => void;
  onAddProduct: () => void;
  onViewUnpublished: () => void;
  pendingCount: number;
}) {
  const products = MOCK_PRODUCTS.filter((p) => p.shopId === shop.id);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const catRef = useRef<HTMLDivElement>(null);
  const categories = shop?.categories || [...new Set(products.map((p) => p.category))];

  const filtered = categoryFilter ? products.filter((p) => p.category === categoryFilter) : products;

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src={shop.avatar} className="w-14 h-14 rounded-full border-2 border-primary/20 object-cover" alt="" />
            <div>
              <h2 className="font-bold text-lg flex items-center gap-2">
                {shop.name}
                {shop.isVerified && <ShieldCheck className="w-4 h-4 text-primary" />}
              </h2>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" /> {shop.address}, {shop.ward}
              </div>
              <div className="text-xs font-medium text-foreground">{shop.province}</div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="rounded-full relative" onClick={onViewUnpublished}>
              <Eye className="w-3.5 h-3.5 mr-1.5" /> Sản phẩm chưa đăng
              {pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {pendingCount}
                </span>
              )}
            </Button>
            <Button size="sm" className="rounded-full shadow-md shadow-primary/20" onClick={onAddProduct}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Thêm mặt hàng
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5 text-amber-500 font-semibold">
            <Star className="w-3.5 h-3.5 fill-current" /> {shop.rating}
          </div>
          <span>•</span>
          <span>{shop.totalOrders} đơn hoàn thành</span>
          <span>•</span>
          <span>Tham gia {formatDistanceToNow(new Date(shop.joinedDate), { locale: vi, addSuffix: true })}</span>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="relative">
          <button
            type="button"
            onClick={() => catRef.current?.scrollBy({ left: -200, behavior: "smooth" })}
            className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 bg-white border shadow rounded-full p-1.5"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <div ref={catRef} className="flex gap-2 overflow-x-auto hide-scrollbar py-1 px-1">
            <button
              type="button"
              onClick={() => setCategoryFilter(null)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium border transition-all",
                !categoryFilter ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground hover:border-primary/40"
              )}
            >
              Tất cả
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat === categoryFilter ? null : cat)}
                className={cn(
                  "flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium border transition-all",
                  categoryFilter === cat
                    ? "bg-primary text-white border-primary"
                    : "bg-white text-muted-foreground hover:border-primary/40"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => catRef.current?.scrollBy({ left: 200, behavior: "smooth" })}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-white border shadow rounded-full p-1.5"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div>
        <h3 className="font-bold mb-3 flex items-center gap-2 text-sm">
          <Store className="w-4 h-4 text-primary" /> Sản phẩm ({filtered.length})
        </h3>
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border">
            <Package className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-muted-foreground">Chưa có sản phẩm nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((p) => (
              <div
                key={p.id}
                role="button"
                tabIndex={0}
                onClick={() => onViewProduct(p.id)}
                onKeyDown={(e) => e.key === "Enter" && onViewProduct(p.id)}
                className="bg-white rounded-2xl border hover:shadow-md transition-all cursor-pointer overflow-hidden group"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={p.images[0]}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    alt=""
                  />
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm line-clamp-1 mb-1">{p.name}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    {p.buyPrice ? (
                      <span className="text-primary font-medium">{formatCurrency(p.buyPrice)}</span>
                    ) : p.rentPrice ? (
                      <span>{formatCurrency(p.rentPrice)}/ngày</span>
                    ) : null}
                    <span className="flex items-center gap-0.5 text-amber-500">
                      <Star className="w-3 h-3 fill-current" /> {p.rating}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
