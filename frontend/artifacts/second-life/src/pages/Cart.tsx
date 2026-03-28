import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Trash2, ShoppingBag, CalendarClock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-mock-api";
import { formatCurrency } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

export default function Cart() {
  const [, setLocation] = useLocation();
  const { cartItems, removeFromCart } = useCart();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems.map(item => item.cartItemId));
    }
  };

  const selectedTotal = cartItems
    .filter(item => selectedItems.includes(item.cartItemId))
    .reduce((sum, item) => sum + (item.rentalDates ? (item.rentPrice * 7) : item.buyPrice), 0);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gray-50/30">
        <div className="text-center">
          <img src={`${import.meta.env.BASE_URL}images/empty-cart.png`} alt="Giỏ hàng trống" className="w-64 h-64 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl font-display font-bold mb-3">Giỏ hàng của bạn đang trống</h2>
          <p className="text-muted-foreground mb-8">Có vẻ bạn chưa thêm sản phẩm nào vào giỏ hàng.</p>
          <Link href="/search">
            <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20">Bắt đầu mua sắm</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30 pt-8 pb-32">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-display font-bold mb-8">Giỏ hàng</h1>

        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden mb-8">
          <div className="p-4 border-b bg-gray-50/50 flex items-center gap-4">
            <Checkbox 
              id="select-all" 
              checked={selectedItems.length === cartItems.length && cartItems.length > 0}
              onCheckedChange={toggleAll}
            />
            <label htmlFor="select-all" className="font-semibold cursor-pointer select-none">
              Chọn tất cả ({cartItems.length} sản phẩm)
            </label>
          </div>

          <div className="divide-y">
            {cartItems.map((item) => (
              <div key={item.cartItemId} className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center hover:bg-gray-50/30 transition-colors">
                <div className="flex items-center gap-4">
                  <Checkbox 
                    checked={selectedItems.includes(item.cartItemId)}
                    onCheckedChange={() => toggleSelect(item.cartItemId)}
                  />
                  <img src={item.images[0]} alt={item.name} className="w-24 h-24 rounded-xl object-cover border" />
                </div>
                
                <div className="flex-1 space-y-1">
                  <h3 className="font-bold text-lg line-clamp-1">{item.name}</h3>
                  {item.rentalDates ? (
                    <div className="flex items-center gap-2 text-sm text-secondary-foreground font-medium bg-secondary/10 w-max px-2 py-1 rounded-md">
                      <CalendarClock className="w-4 h-4" /> Thuê: 7 ngày
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-primary font-medium bg-primary/10 w-max px-2 py-1 rounded-md">
                      <ShoppingBag className="w-4 h-4" /> Mua
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground pt-2">Cửa hàng: {item.shopId}</p>
                </div>

                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4">
                  <div className="text-xl font-bold text-foreground">
                    {formatCurrency(item.rentalDates ? (item.rentPrice * 7) : item.buyPrice)}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive hover:bg-destructive/10 rounded-full"
                    onClick={() => removeFromCart(item.cartItemId)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Xóa
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sticky Checkout Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t p-4 z-40 shadow-[0_-10px_30px_rgb(0,0,0,0.05)]">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Tổng cộng ({selectedItems.length} sản phẩm)</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(selectedTotal)}</p>
              </div>
            </div>
            <Button 
              size="lg" 
              className="w-full sm:w-auto rounded-full px-12 h-14 shadow-lg shadow-primary/20 text-lg"
              disabled={selectedItems.length === 0}
              onClick={() => setLocation('/checkout')}
            >
              Thanh toán <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
