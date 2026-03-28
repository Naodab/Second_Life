import { useState, useRef } from "react";
import { useLocation, Link } from "wouter";
import {
  Plus, LayoutDashboard, LogOut, Package, BarChart3, ChevronDown, ChevronUp,
  Search, Store, Building2, ShieldCheck, MapPin, Star, Clock, Image as ImageIcon,
  Video, X, CheckCircle2, ChevronLeft, ChevronRight, Pause, Edit, Trash2,
  AlertCircle, TrendingUp, ShoppingBag, CalendarClock, FileText, Upload,
  Bell, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MOCK_PRODUCTS, MOCK_SHOPS, MOCK_ORDERS, MOCK_RENTAL_SLOTS, MOCK_REVIEWS,
  type Product, type Order, type OrderStatus
} from "@/lib/mock-data";
import { formatCurrency, cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

type View = 'dashboard' | 'facility' | 'facility-product' | 'unpublished' | 'orders';

interface PendingProduct {
  id: string;
  name: string;
  description: string;
  color: string;
  material: string;
  forRent: boolean;
  forBuy: boolean;
  rentQty: number;
  buyQty: number;
  totalQty: number;
  previewUrl: string;
  facilityId: string;
  rentPrice?: number;
  buyPrice?: number;
}

const MY_FACILITY_IDS = ['s1', 's2'];

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  completed: 'Đã hoàn thành',
  pending_approval: 'Chờ duyệt',
  shipping: 'Đang giao',
  waiting_confirm: 'Chờ xác nhận',
};

const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  completed: 'bg-green-100 text-green-700',
  pending_approval: 'bg-amber-100 text-amber-700',
  shipping: 'bg-blue-100 text-blue-700',
  waiting_confirm: 'bg-purple-100 text-purple-700',
};

function StatCard({ label, value, sub, color = "text-foreground" }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className={cn("text-2xl font-bold", color)}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function RevenueBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-8 flex-shrink-0">{label}</span>
      <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-primary/80 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium w-20 text-right">{formatCurrency(value)}</span>
    </div>
  );
}

function DashboardView({ facilityId }: { facilityId: string }) {
  const orders = MOCK_ORDERS.filter(o => o.facilityId === facilityId);
  const monthRevenue = orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.total, 0);
  const productCount = MOCK_PRODUCTS.filter(p => p.shopId === facilityId).length;
  const rentCount = MOCK_PRODUCTS.filter(p => p.shopId === facilityId && (p.type === 'rent' || p.type === 'both')).length;

  const monthlyData = [
    { label: "T1", value: 1200000 }, { label: "T2", value: 2500000 },
    { label: "T3", value: 1800000 }, { label: "T4", value: 3200000 },
    { label: "T5", value: 2100000 }, { label: "T6", value: 4500000 },
    { label: "T7", value: 3800000 }, { label: "T8", value: 5200000 },
    { label: "T9", value: 4100000 }, { label: "T10", value: 6300000 },
    { label: "T11", value: 5700000 }, { label: "T12", value: monthRevenue },
  ];
  const maxMonthly = Math.max(...monthlyData.map(d => d.value));
  const yearRevenue = monthlyData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold mb-1">Dashboard</h2>
        <p className="text-muted-foreground text-sm">Tổng quan hoạt động kinh doanh</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Doanh thu tháng này" value={formatCurrency(monthRevenue)} color="text-primary" sub="Tháng 3/2026" />
        <StatCard label="Doanh thu năm nay" value={formatCurrency(yearRevenue)} color="text-green-600" />
        <StatCard label="Tổng sản phẩm" value={String(productCount)} sub={`${rentCount} đang cho thuê`} />
        <StatCard label="Tổng đơn hàng" value={String(orders.length)} sub={`${orders.filter(o => o.status === 'completed').length} hoàn thành`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Doanh thu theo tháng</h3>
          <div className="space-y-2.5">
            {monthlyData.map(d => <RevenueBar key={d.label} label={d.label} value={d.value} max={maxMonthly} />)}
          </div>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> Trạng thái đơn hàng</h3>
          <div className="space-y-3">
            {(['pending_approval', 'shipping', 'waiting_confirm', 'completed'] as OrderStatus[]).map(status => {
              const count = orders.filter(o => o.status === status).length;
              return (
                <div key={status} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", ORDER_STATUS_COLORS[status])}>
                      {ORDER_STATUS_LABELS[status]}
                    </span>
                  </div>
                  <span className="font-bold">{count}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t">
            <h4 className="font-semibold text-sm mb-3">Đơn hàng gần đây</h4>
            <div className="space-y-2">
              {orders.slice(0, 3).map(o => (
                <div key={o.id} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0"><AvatarImage src={o.buyerAvatar} /><AvatarFallback className="text-xs">{o.buyerName[0]}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{o.buyerName}</p>
                    <p className="text-xs text-muted-foreground">{o.items[0].productName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{formatCurrency(o.total)}</p>
                    <p className="text-xs text-muted-foreground">{o.createdAt}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RentalSchedule({ productId }: { productId: string }) {
  const slots = MOCK_RENTAL_SLOTS[productId] || [];
  if (!slots.length) return null;

  const statusConfig = {
    booked: { label: "Đã đặt", cls: "bg-red-100 text-red-700 border-red-200" },
    available: { label: "Trống", cls: "bg-green-50 text-green-700 border-green-200" },
    pending: { label: "Chờ xác nhận", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  };

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <h3 className="font-bold mb-4 flex items-center gap-2">
        <CalendarClock className="w-4 h-4 text-primary" /> Lịch cho thuê
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="pb-2 pr-4 font-semibold text-muted-foreground text-xs">Ngày</th>
              <th className="pb-2 pr-4 font-semibold text-muted-foreground text-xs">Trạng thái</th>
              <th className="pb-2 font-semibold text-muted-foreground text-xs">Khách thuê</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {slots.map((slot, i) => {
              const cfg = statusConfig[slot.status];
              const dateLabel = new Date(slot.date).toLocaleDateString('vi', { weekday: 'short', day: '2-digit', month: '2-digit' });
              return (
                <tr key={i} className="hover:bg-gray-50/50">
                  <td className="py-2.5 pr-4 font-medium">{dateLabel}</td>
                  <td className="py-2.5 pr-4">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", cfg.cls)}>{cfg.label}</span>
                  </td>
                  <td className="py-2.5 text-muted-foreground text-sm">{slot.buyerName || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OwnerProductDetail({
  product, onBack
}: { product: Product; onBack: () => void }) {
  const [activeImage, setActiveImage] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const { toast } = useToast();
  const reviews = MOCK_REVIEWS;
  const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

  const prev = () => setActiveImage(i => (i - 1 + product.images.length) % product.images.length);
  const next = () => setActiveImage(i => (i + 1) % product.images.length);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="rounded-full">
          <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại
        </Button>
        <h2 className="text-xl font-bold truncate flex-1">{product.name}</h2>
        <Badge className={isActive ? "bg-green-100 text-green-700 border-none" : "bg-gray-100 text-gray-500 border-none"}>
          {isActive ? "Đang hoạt động" : "Đã ngưng"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-3">
          <div className="aspect-square rounded-2xl overflow-hidden bg-white border relative group">
            <img src={product.images[activeImage]} alt={product.name} className="w-full h-full object-cover" />
            {product.images.length > 1 && (
              <>
                <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto hide-scrollbar">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImage(i)} className={cn("w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0", i === activeImage ? "border-primary" : "border-transparent opacity-60")}>
                  <img src={img} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border p-5 shadow-sm">
            <div className="flex gap-2 mb-3 flex-wrap">
              <Badge variant="outline" className="bg-primary/5 text-primary">{product.category}</Badge>
              <Badge variant="outline" className="bg-gray-100 text-gray-600">{product.condition}</Badge>
            </div>
            <h3 className="text-xl font-bold mb-2">{product.name}</h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{product.description}</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {product.buyPrice && (
                <div className="border rounded-xl p-3 bg-primary/5">
                  <p className="text-xs text-muted-foreground">Giá bán</p>
                  <p className="font-bold text-primary">{formatCurrency(product.buyPrice)}</p>
                  {product.aiSuggestedBuyPrice && (
                    <p className="text-xs text-muted-foreground mt-1">AI: {formatCurrency(product.aiSuggestedBuyPrice)}</p>
                  )}
                </div>
              )}
              {product.rentPrice && (
                <div className="border rounded-xl p-3 bg-secondary/10">
                  <p className="text-xs text-muted-foreground">Giá thuê/ngày</p>
                  <p className="font-bold text-secondary-foreground">{formatCurrency(product.rentPrice)}</p>
                  {product.aiSuggestedRentPrice && (
                    <p className="text-xs text-muted-foreground mt-1">AI: {formatCurrency(product.aiSuggestedRentPrice)}/ngày</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground pb-4 border-b mb-4">
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="font-medium">{avgRating.toFixed(1)}</span>
              </div>
              <span>•</span>
              <span>Kho: <strong className="text-foreground">{product.stock}</strong></span>
              <span>•</span>
              <span>{product.reviewsCount} đánh giá</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="rounded-full">
                <Edit className="w-3.5 h-3.5 mr-1.5" /> Chỉnh sửa
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn("rounded-full", isActive ? "text-amber-600 border-amber-200 hover:bg-amber-50" : "text-green-600 border-green-200 hover:bg-green-50")}
                onClick={() => {
                  setIsActive(!isActive);
                  toast({ title: isActive ? "Đã ngưng hoạt động" : "Đã kích hoạt lại", description: product.name });
                }}
              >
                <Pause className="w-3.5 h-3.5 mr-1.5" />
                {isActive ? "Ngưng hoạt động" : "Kích hoạt lại"}
              </Button>
              <Button variant="outline" size="sm" className="rounded-full text-destructive border-destructive/30 hover:bg-destructive/10">
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Xóa
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border p-5 shadow-sm">
            <h4 className="font-bold mb-3 text-sm">Thống kê sản phẩm</h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-lg font-bold text-primary">12</p>
                <p className="text-xs text-muted-foreground">Lượt xem</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-lg font-bold">{product.reviewsCount}</p>
                <p className="text-xs text-muted-foreground">Đánh giá</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-lg font-bold text-green-600">5</p>
                <p className="text-xs text-muted-foreground">Đơn hoàn thành</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {(product.type === 'rent' || product.type === 'both') && (
        <RentalSchedule productId={product.id} />
      )}
    </div>
  );
}

function FacilityView({
  facilityId, onViewProduct, onAddProduct, onViewUnpublished, pendingCount
}: {
  facilityId: string;
  onViewProduct: (id: string) => void;
  onAddProduct: () => void;
  onViewUnpublished: () => void;
  pendingCount: number;
}) {
  const shop = MOCK_SHOPS.find(s => s.id === facilityId);
  const products = MOCK_PRODUCTS.filter(p => p.shopId === facilityId);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const catRef = useRef<HTMLDivElement>(null);
  const categories = shop?.categories || [...new Set(products.map(p => p.category))];

  if (!shop) return null;

  const filtered = categoryFilter ? products.filter(p => p.category === categoryFilter) : products;

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src={shop.avatar} className="w-14 h-14 rounded-full border-2 border-primary/20 object-cover" />
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
          <button onClick={() => catRef.current?.scrollBy({ left: -200, behavior: "smooth" })} className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 bg-white border shadow rounded-full p-1.5">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <div ref={catRef} className="flex gap-2 overflow-x-auto hide-scrollbar py-1 px-1">
            <button onClick={() => setCategoryFilter(null)} className={cn("flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium border transition-all", !categoryFilter ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground hover:border-primary/40")}>
              Tất cả
            </button>
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategoryFilter(cat === categoryFilter ? null : cat)}
                className={cn("flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium border transition-all", categoryFilter === cat ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground hover:border-primary/40")}>
                {cat}
              </button>
            ))}
          </div>
          <button onClick={() => catRef.current?.scrollBy({ left: 200, behavior: "smooth" })} className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-white border shadow rounded-full p-1.5">
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
            {filtered.map(p => (
              <div key={p.id} onClick={() => onViewProduct(p.id)}
                className="bg-white rounded-2xl border hover:shadow-md transition-all cursor-pointer overflow-hidden group">
                <div className="aspect-square overflow-hidden">
                  <img src={p.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm line-clamp-1 mb-1">{p.name}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    {p.buyPrice ? <span className="text-primary font-medium">{formatCurrency(p.buyPrice)}</span> : p.rentPrice ? <span>{formatCurrency(p.rentPrice)}/ngày</span> : null}
                    <span className="flex items-center gap-0.5 text-amber-500"><Star className="w-3 h-3 fill-current" /> {p.rating}</span>
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

function UnpublishedView({
  products, onPublish
}: { products: PendingProduct[]; onPublish: (id: string, rentPrice?: number, buyPrice?: number) => void }) {
  const [prices, setPrices] = useState<Record<string, { rent: string; buy: string }>>({});

  if (products.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border">
        <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
        <h3 className="font-bold text-lg mb-1">Không có sản phẩm nào chờ đăng</h3>
        <p className="text-muted-foreground text-sm">Tất cả sản phẩm đã được đăng.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold mb-1">Sản phẩm chưa đăng</h2>
        <p className="text-sm text-muted-foreground">{products.length} sản phẩm đang chờ định giá và đăng bán</p>
      </div>
      {products.map(p => {
        const priceState = prices[p.id] || { rent: p.rentPrice ? String(p.rentPrice) : '', buy: p.buyPrice ? String(p.buyPrice) : '' };
        const setPrice = (field: 'rent' | 'buy', val: string) =>
          setPrices(prev => ({ ...prev, [p.id]: { ...(prev[p.id] || { rent: '', buy: '' }), [field]: val } }));
        return (
          <div key={p.id} className="bg-white rounded-2xl border shadow-sm p-5 flex gap-4">
            <img src={p.previewUrl} className="w-20 h-20 rounded-xl object-cover border flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold">{p.name}</h3>
                <Badge variant="outline" className="text-xs flex-shrink-0 bg-amber-50 text-amber-700 border-amber-200">
                  <Bell className="w-3 h-3 mr-1" /> Chờ đăng
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{p.description}</p>
              <div className="flex flex-wrap gap-3 items-end">
                {p.forBuy && (
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Giá bán (VND)</label>
                    <Input type="number" placeholder="0" value={priceState.buy} onChange={e => setPrice('buy', e.target.value)} className="h-8 w-36 text-sm rounded-lg" />
                  </div>
                )}
                {p.forRent && (
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Giá thuê/ngày (VND)</label>
                    <Input type="number" placeholder="0" value={priceState.rent} onChange={e => setPrice('rent', e.target.value)} className="h-8 w-36 text-sm rounded-lg" />
                  </div>
                )}
                <Button size="sm" className="rounded-full h-8" onClick={() => onPublish(p.id, priceState.rent ? Number(priceState.rent) : undefined, priceState.buy ? Number(priceState.buy) : undefined)}>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Đăng ngay
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OrdersView({ facilityId }: { facilityId: string }) {
  const [activeTab, setActiveTab] = useState<OrderStatus>('pending_approval');
  const allOrders = MOCK_ORDERS.filter(o => o.facilityId === facilityId);
  const filtered = allOrders.filter(o => o.status === activeTab);

  const tabs: { key: OrderStatus; label: string }[] = [
    { key: 'pending_approval', label: 'Chờ duyệt' },
    { key: 'shipping', label: 'Đang giao' },
    { key: 'waiting_confirm', label: 'Chờ xác nhận' },
    { key: 'completed', label: 'Hoàn thành' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold mb-1">Đơn hàng</h2>
        <p className="text-sm text-muted-foreground">{allOrders.length} đơn hàng tổng cộng</p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map(t => {
          const cnt = allOrders.filter(o => o.status === t.key).length;
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5",
                activeTab === t.key ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground")}>
              {t.label}
              {cnt > 0 && <span className={cn("text-xs rounded-full px-1.5", activeTab === t.key ? "bg-primary text-white" : "bg-gray-300 text-gray-600")}>{cnt}</span>}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border">
          <ShoppingBag className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-40" />
          <p className="text-muted-foreground">Không có đơn hàng nào trong mục này.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <div key={order.id} className="bg-white rounded-2xl border shadow-sm p-5">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10"><AvatarImage src={order.buyerAvatar} /><AvatarFallback>{order.buyerName[0]}</AvatarFallback></Avatar>
                  <div>
                    <p className="font-semibold">{order.buyerName}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{order.address}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", ORDER_STATUS_COLORS[order.status])}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">#{order.id} • {order.createdAt}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <img src={item.productImage} className="w-10 h-10 rounded-lg object-cover border" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.mode === 'rent' ? `Thuê ${item.rentStart} → ${item.rentEnd}` : 'Mua'} • x{item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-primary">{formatCurrency(item.price)}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <p className="font-bold">Tổng: <span className="text-primary">{formatCurrency(order.total)}</span></p>
                <div className="flex gap-2">
                  {order.status === 'pending_approval' && (
                    <>
                      <Button size="sm" variant="outline" className="rounded-full text-destructive border-destructive/30 text-xs h-8">Từ chối</Button>
                      <Button size="sm" className="rounded-full text-xs h-8">Xác nhận đơn</Button>
                    </>
                  )}
                  {order.status === 'shipping' && (
                    <Button size="sm" className="rounded-full text-xs h-8">Đã giao xong</Button>
                  )}
                  {order.status === 'waiting_confirm' && (
                    <Button size="sm" className="rounded-full text-xs h-8 bg-green-600 hover:bg-green-700">Xác nhận hoàn thành</Button>
                  )}
                  {order.status === 'completed' && (
                    <Button size="sm" variant="outline" className="rounded-full text-xs h-8">Xem chi tiết</Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddProductModal({
  open, facilityId, onClose, onSubmit
}: { open: boolean; facilityId: string; onClose: () => void; onSubmit: (data: any) => void }) {
  const [form, setForm] = useState({
    name: '', description: '', color: '', material: '',
    forRent: false, forBuy: false,
    rentQty: 1, buyQty: 1, totalQty: 1,
    coverFile: null as File | null,
    coverPreview: '',
    otherFiles: [] as { name: string; preview: string; type: string }[],
  });
  const coverRef = useRef<HTMLInputElement>(null);
  const otherRef = useRef<HTMLInputElement>(null);

  const setField = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setField('coverFile', file);
    setField('coverPreview', url);
  };

  const handleOtherFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 10 - form.otherFiles.length;
    files.slice(0, remaining).forEach(f => {
      const url = URL.createObjectURL(f);
      setForm(prev => ({
        ...prev,
        otherFiles: [...prev.otherFiles, { name: f.name, preview: f.type.startsWith('video') ? '' : url, type: f.type }]
      }));
    });
  };

  const removeOtherFile = (i: number) => setForm(prev => ({ ...prev, otherFiles: prev.otherFiles.filter((_, idx) => idx !== i) }));

  const canSubmit = form.name.trim() && (form.forRent || form.forBuy);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      ...form,
      facilityId,
      previewUrl: form.coverPreview || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop'
    });
  };

  const reset = () => setForm({ name: '', description: '', color: '', material: '', forRent: false, forBuy: false, rentQty: 1, buyQty: 1, totalQty: 1, coverFile: null, coverPreview: '', otherFiles: [] });

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { onClose(); reset(); } }}>
      <DialogContent className="sm:max-w-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-display">Thêm mặt hàng mới</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Tên sản phẩm <span className="text-destructive">*</span></label>
              <Input placeholder="Vd: Máy ảnh cổ điển" value={form.name} onChange={e => setField('name', e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Màu sắc</label>
              <Input placeholder="Vd: Đen, Trắng, Xanh" value={form.color} onChange={e => setField('color', e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Chất liệu</label>
              <Input placeholder="Vd: Nhựa, Kim loại, Gỗ" value={form.material} onChange={e => setField('material', e.target.value)} className="rounded-xl" />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold mb-1.5 block">Mô tả</label>
            <textarea className="w-full border rounded-xl p-3 text-sm min-h-[80px] resize-none" placeholder="Mô tả tình trạng, thông số kỹ thuật..." value={form.description} onChange={e => setField('description', e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Hình thức <span className="text-destructive">*</span></label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={form.forRent} onCheckedChange={v => setField('forRent', Boolean(v))} />
                <span className="text-sm font-medium">Cho thuê</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={form.forBuy} onCheckedChange={v => setField('forBuy', Boolean(v))} />
                <span className="text-sm font-medium">Mua bán</span>
              </label>
            </div>
          </div>

          {(form.forRent || form.forBuy) && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              {form.forRent && form.forBuy ? (
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Số lượng tổng</label>
                  <Input type="number" min={1} value={form.totalQty} onChange={e => setField('totalQty', Number(e.target.value))} className="w-28 rounded-xl h-9" />
                </div>
              ) : (
                <>
                  {form.forRent && (
                    <div>
                      <label className="text-sm font-semibold mb-1.5 block">Số lượng cho thuê</label>
                      <Input type="number" min={1} value={form.rentQty} onChange={e => setField('rentQty', Number(e.target.value))} className="w-28 rounded-xl h-9" />
                    </div>
                  )}
                  {form.forBuy && (
                    <div>
                      <label className="text-sm font-semibold mb-1.5 block">Số lượng mua bán</label>
                      <Input type="number" min={1} value={form.buyQty} onChange={e => setField('buyQty', Number(e.target.value))} className="w-28 rounded-xl h-9" />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Ảnh bìa (ảnh chính)</label>
              <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
              <div
                onClick={() => coverRef.current?.click()}
                className={cn("border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors hover:bg-gray-50 aspect-video overflow-hidden",
                  form.coverPreview ? "border-primary/40" : "border-gray-300")}
              >
                {form.coverPreview ? (
                  <img src={form.coverPreview} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground py-6">
                    <ImageIcon className="w-8 h-8 opacity-50" />
                    <span className="text-xs">Nhấn để tải ảnh bìa</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold mb-1.5 flex items-center gap-2">
                Ảnh & Video khác
                <span className="text-xs text-muted-foreground font-normal">({form.otherFiles.length}/10)</span>
              </label>
              <input ref={otherRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleOtherFiles} />
              <div className="grid grid-cols-3 gap-2">
                {form.otherFiles.map((f, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border bg-gray-100">
                    {f.type.startsWith('video') ? (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
                        <Video className="w-6 h-6" />
                      </div>
                    ) : (
                      <img src={f.preview} className="w-full h-full object-cover" />
                    )}
                    <button onClick={() => removeOtherFile(i)} className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {form.otherFiles.length < 10 && (
                  <div onClick={() => otherRef.current?.click()} className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                    <Plus className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {!canSubmit && form.name && (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-xl p-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Vui lòng chọn ít nhất một hình thức (cho thuê hoặc mua bán).</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { onClose(); reset(); }} className="rounded-full">Hủy</Button>
          <Button disabled={!canSubmit} onClick={handleSubmit} className="rounded-full px-8">
            Tiếp theo <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UploadingModal({ open }: { open: boolean }) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-sm rounded-3xl text-center">
        <div className="py-8 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="w-8 h-8 text-primary animate-bounce" />
          </div>
          <div>
            <DialogDescription className="sr-only">Đang tải lên sản phẩm</DialogDescription>
            <h3 className="font-bold text-lg mb-2">Đang xử lý...</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Hệ thống đang tải ảnh lên và phân tích để đề xuất giá phù hợp. Vui lòng chờ trong giây lát.
            </p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '70%' }} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Listings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [view, setView] = useState<View>('dashboard');
  const [activeFacilityId, setActiveFacilityId] = useState<string>(MY_FACILITY_IDS[0]);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [facilitiesOpen, setFacilitiesOpen] = useState(true);
  const [facilitySearch, setFacilitySearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadingModal, setIsUploadingModal] = useState(false);
  const [pendingProducts, setPendingProducts] = useState<PendingProduct[]>([]);

  const facilities = MOCK_SHOPS.filter(s => MY_FACILITY_IDS.includes(s.id)).filter(s =>
    !facilitySearch || s.name.toLowerCase().includes(facilitySearch.toLowerCase())
  );

  const facilityPendingProducts = pendingProducts.filter(p => p.facilityId === activeFacilityId);

  const handleSelectFacility = (id: string) => {
    setActiveFacilityId(id);
    setView('facility');
    setActiveProductId(null);
  };

  const handleViewProduct = (productId: string) => {
    setActiveProductId(productId);
    setView('facility-product');
  };

  const handleAddProductSubmit = (data: any) => {
    setIsAddModalOpen(false);
    setIsUploadingModal(true);
    setTimeout(() => {
      setIsUploadingModal(false);
      const pending: PendingProduct = {
        id: `pending-${Date.now()}`,
        name: data.name,
        description: data.description,
        color: data.color,
        material: data.material,
        forRent: data.forRent,
        forBuy: data.forBuy,
        rentQty: data.rentQty,
        buyQty: data.buyQty,
        totalQty: data.totalQty,
        previewUrl: data.previewUrl,
        facilityId: data.facilityId,
      };
      setPendingProducts(prev => [...prev, pending]);
      toast({
        title: "Upload hoàn tất!",
        description: "Sản phẩm đã được xử lý. Vào 'Sản phẩm chưa đăng' để định giá và đăng.",
      });
    }, 2500);
  };

  const handlePublish = (id: string, rentPrice?: number, buyPrice?: number) => {
    setPendingProducts(prev => prev.filter(p => p.id !== id));
    toast({ title: "Đã đăng sản phẩm!", description: "Sản phẩm của bạn đã được đăng bán." });
  };

  const activeProduct = activeProductId ? MOCK_PRODUCTS.find(p => p.id === activeProductId) : null;

  const navItem = (label: string, icon: React.ReactNode, isActive: boolean, onClick: () => void) => (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left",
        isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
      )}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r h-screen sticky top-0 flex flex-col flex-shrink-0 shadow-sm">
        <div className="p-4 border-b flex items-center gap-2">
          <div className="bg-primary/20 p-1.5 rounded-lg">
            <img src={`${import.meta.env.BASE_URL}images/logo-leaf.png`} alt="Logo" className="w-5 h-5 object-contain" />
          </div>
          <span className="font-display font-bold text-base leading-tight">Quản lý bán hàng</span>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItem("Dashboard", <LayoutDashboard className="w-4 h-4" />, view === 'dashboard', () => setView('dashboard'))}

          <div>
            <button
              onClick={() => setFacilitiesOpen(!facilitiesOpen)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-gray-100 hover:text-foreground transition-all"
            >
              <span className="flex items-center gap-3"><Building2 className="w-4 h-4" /> Cơ sở</span>
              {facilitiesOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {facilitiesOpen && (
              <div className="mt-1 space-y-1 pl-2">
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <Input
                    placeholder="Tìm cơ sở..."
                    value={facilitySearch}
                    onChange={e => setFacilitySearch(e.target.value)}
                    className="pl-7 h-7 text-xs rounded-lg border-gray-200"
                  />
                </div>
                {facilities.map(f => (
                  <button
                    key={f.id}
                    onClick={() => handleSelectFacility(f.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-all",
                      activeFacilityId === f.id && (view === 'facility' || view === 'facility-product' || view === 'unpublished')
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                    )}
                  >
                    <img src={f.avatar} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                    <span className="truncate text-xs">{f.name}</span>
                    {pendingProducts.filter(p => p.facilityId === f.id).length > 0 && (
                      <span className="ml-auto bg-primary text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                        {pendingProducts.filter(p => p.facilityId === f.id).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {navItem(
            "Đơn hàng",
            <FileText className="w-4 h-4" />,
            view === 'orders',
            () => setView('orders')
          )}
        </nav>

        <div className="p-3 border-t space-y-1">
          <button onClick={() => setLocation('/')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-gray-100 hover:text-foreground transition-all">
            <Store className="w-4 h-4" /> Về trang chợ
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all">
            <LogOut className="w-4 h-4" /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 overflow-y-auto min-h-screen">
        <div className="max-w-5xl mx-auto">
          {view === 'dashboard' && <DashboardView facilityId={activeFacilityId} />}

          {view === 'facility' && (
            <FacilityView
              facilityId={activeFacilityId}
              onViewProduct={handleViewProduct}
              onAddProduct={() => setIsAddModalOpen(true)}
              onViewUnpublished={() => setView('unpublished')}
              pendingCount={facilityPendingProducts.length}
            />
          )}

          {view === 'facility-product' && activeProduct && (
            <OwnerProductDetail
              product={activeProduct}
              onBack={() => setView('facility')}
            />
          )}

          {view === 'unpublished' && (
            <UnpublishedView
              products={facilityPendingProducts}
              onPublish={handlePublish}
            />
          )}

          {view === 'orders' && <OrdersView facilityId={activeFacilityId} />}
        </div>
      </main>

      <AddProductModal
        open={isAddModalOpen}
        facilityId={activeFacilityId}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddProductSubmit}
      />

      <UploadingModal open={isUploadingModal} />
    </div>
  );
}
