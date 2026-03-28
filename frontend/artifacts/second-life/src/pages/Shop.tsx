import { useRoute } from "wouter";
import { Star, ShieldCheck, MapPin, Store, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { useShop } from "@/hooks/use-mock-api";
import { Skeleton } from "@/components/ui/skeleton";

export default function ShopPage() {
  const [, params] = useRoute("/shop/:id");
  const shopId = params?.id || "s1";
  
  const { data: shop, products, isLoading } = useShop(shopId);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse space-y-8">
        <Skeleton className="h-48 w-full rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!shop) return <div className="text-center py-20 text-2xl font-bold">Không tìm thấy cửa hàng</div>;

  return (
    <div className="min-h-screen bg-gray-50/30 pb-20">
      {/* Shop Header Banner */}
      <div className="bg-primary/10 h-48 sm:h-64 relative border-b border-primary/20">
        <div className="absolute -bottom-16 left-8 sm:left-12 flex items-end gap-6">
          <div className="bg-white p-2 rounded-3xl shadow-lg border">
            <img src={shop.avatar} alt={shop.name} className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
          <div>
            <h1 className="text-3xl font-display font-bold flex items-center gap-3">
              {shop.name}
              {shop.isVerified && <ShieldCheck className="w-6 h-6 text-primary" />}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              <div className="flex items-center gap-1 text-amber-500 font-medium">
                <Star className="w-4 h-4 fill-current" />
                <span>{shop.rating}</span>
              </div>
              <span>•</span>
              <span>{shop.totalOrders} đơn hàng</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{shop.address}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-full bg-white">
              <MessageSquare className="w-4 h-4 mr-2" /> Nhắn tin
            </Button>
            <Button className="rounded-full shadow-md shadow-primary/20 px-8">
              Theo dõi
            </Button>
          </div>
        </div>

        <h2 className="text-2xl font-display font-bold mb-6">Sản phẩm của cửa hàng ({products.length})</h2>
        
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border">
            <h3 className="text-xl font-bold text-foreground mb-2">Chưa có sản phẩm nào</h3>
            <p className="text-muted-foreground">Cửa hàng này chưa đăng sản phẩm nào.</p>
          </div>
        )}
      </div>
    </div>
  );
}
