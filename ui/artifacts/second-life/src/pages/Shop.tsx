import { useRef, useState } from "react";
import { useRoute, Link } from "wouter";
import { Star, ShieldCheck, MapPin, Store, MessageSquare, Package, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/ProductCard";
import { useShop } from "@/hooks/use-mock-api";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";

function CategorySlider({ categories }: { categories: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * 200, behavior: "smooth" });

  return (
    <div className="relative">
      <button
        onClick={() => scroll(-1)}
        className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white border shadow-md rounded-full p-1.5 hover:bg-gray-50"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <div ref={ref} className="flex gap-3 overflow-x-auto hide-scrollbar py-2 px-1">
        <button
          onClick={() => setActiveCategory(null)}
          className={cn(
            "flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium border transition-all whitespace-nowrap",
            activeCategory === null
              ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
              : "bg-white text-muted-foreground border-border hover:border-primary/40 hover:text-primary"
          )}
        >
          Tất cả
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
            className={cn(
              "flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium border transition-all whitespace-nowrap",
              activeCategory === cat
                ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                : "bg-white text-muted-foreground border-border hover:border-primary/40 hover:text-primary"
            )}
          >
            {cat}
          </button>
        ))}
      </div>
      <button
        onClick={() => scroll(1)}
        className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white border shadow-md rounded-full p-1.5 hover:bg-gray-50"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
      <div className="mt-1 text-xs text-muted-foreground pl-1">
        {activeCategory ? `Đang lọc: ${activeCategory}` : ""}
      </div>
    </div>
  );
}

export default function ShopPage() {
  const [, params] = useRoute("/shop/:id");
  const shopId = params?.id || "s1";
  const { data: shop, products, isLoading } = useShop(shopId);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse space-y-8">
        <Skeleton className="h-48 w-full rounded-3xl" />
        <Skeleton className="h-32 w-full rounded-3xl" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="w-32 h-10 rounded-full flex-shrink-0" />)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!shop) return <div className="text-center py-20 text-2xl font-bold">Không tìm thấy cửa hàng</div>;

  const shopCategories = shop.categories || [...new Set(products.map(p => p.category))];
  const joinedAgo = formatDistanceToNow(new Date(shop.joinedDate), { locale: vi, addSuffix: true });

  return (
    <div className="min-h-screen bg-gray-50/30 pb-20">

      {/* Shop Banner */}
      <div className="bg-gradient-to-br from-primary/15 via-primary/8 to-transparent h-44 sm:h-56 relative border-b border-primary/10">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, var(--primary) 0%, transparent 60%), radial-gradient(circle at 80% 20%, var(--secondary) 0%, transparent 60%)"
        }} />
        <div className="absolute -bottom-16 left-6 sm:left-10">
          <div className="bg-white p-2 rounded-3xl shadow-lg border">
            <img src={shop.avatar} alt={shop.name} className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">

        {/* Shop Info */}
        <div className="bg-white rounded-3xl border shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-start gap-5">
            <div>
              <h1 className="text-2xl font-display font-bold flex items-center gap-2">
                {shop.name}
                {shop.isVerified && <ShieldCheck className="w-5 h-5 text-primary" />}
              </h1>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>{shop.address}, {shop.ward}</span>
              </div>
              <div className="text-sm font-medium text-foreground mt-0.5 ml-5">{shop.province}</div>

              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5 text-amber-500 font-semibold">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{shop.rating}</span>
                </div>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-1.5">
                  <Package className="w-4 h-4" />
                  <span><strong className="text-foreground">{shop.totalOrders}</strong> đơn đã bán / cho thuê</span>
                </div>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>Tham gia {joinedAgo}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 flex-shrink-0 mt-2 md:mt-0">
              <Link href="/messages">
                <Button variant="outline" className="rounded-full bg-white">
                  <MessageSquare className="w-4 h-4 mr-2" /> Chat ngay
                </Button>
              </Link>
              <Button className="rounded-full shadow-md shadow-primary/20 px-6">
                Theo dõi
              </Button>
            </div>
          </div>
        </div>

        {/* Categories Slider */}
        {shopCategories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">Danh mục</h2>
            <CategorySlider categories={shopCategories} />
          </div>
        )}

        {/* Product List */}
        <div>
          <h2 className="text-xl font-display font-bold mb-5 flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            Sản phẩm của cửa hàng
            <Badge variant="outline" className="ml-2 text-muted-foreground font-normal">{products.length}</Badge>
          </h2>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border">
              <Store className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <h3 className="text-xl font-bold text-foreground mb-2">Chưa có sản phẩm nào</h3>
              <p className="text-muted-foreground">Cửa hàng này chưa đăng sản phẩm nào.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
