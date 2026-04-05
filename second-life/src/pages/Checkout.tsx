import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, ShieldCheck, CreditCard, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/hooks/use-mock-api";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { cartItems, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (cartItems.length === 0 && !isSuccess) {
      setLocation('/cart');
    }
  }, [cartItems, isSuccess, setLocation]);

  const total = cartItems.reduce((sum, item) => sum + (item.rentalDates ? (item.rentPrice * 7) : item.buyPrice), 0);
  const hasRentals = cartItems.some(i => i.rentalDates);
  const depositAmount = hasRentals ? total * 0.3 : 0;
  const finalTotal = total + depositAmount;

  const handleCheckout = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      clearCart();
    }, 2000);
  };

  if (isSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50/30">
        <div className="text-center max-w-md p-8 bg-white rounded-3xl border shadow-xl animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-display font-bold mb-2">Thanh toán thành công!</h2>
          <p className="text-muted-foreground mb-8">Đơn hàng của bạn đã được đặt thành công. Bạn có thể theo dõi trong phần Đơn hàng.</p>
          <div className="flex flex-col gap-3">
            <Button size="lg" className="rounded-full" onClick={() => setLocation('/orders')}>Xem đơn hàng</Button>
            <Button variant="outline" size="lg" className="rounded-full" onClick={() => setLocation('/')}>Về trang chủ</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30 pt-8 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <button onClick={() => setLocation('/cart')} className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Quay lại giỏ hàng
        </button>

        <h1 className="text-3xl font-display font-bold mb-8">Thanh toán</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Shipping Info */}
            <div className="bg-white rounded-3xl border p-6 shadow-sm">
              <h3 className="font-bold text-lg mb-4">Địa chỉ giao hàng</h3>
              <div className="bg-gray-50 p-4 rounded-xl border border-primary/20">
                <p className="font-semibold">Nguyễn Văn A</p>
                <p className="text-sm text-muted-foreground mt-1">+84 90 123 4567</p>
                <p className="text-sm text-muted-foreground mt-1">123 Đường ABC, Phường 1, Quận 1, TP. Hồ Chí Minh</p>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-3xl border p-6 shadow-sm">
              <h3 className="font-bold text-lg mb-4">Phương thức thanh toán</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl border-2 border-primary bg-primary/5 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <span className="font-medium text-primary">PayOS (Chuyển khoản / QR Code)</span>
                  </div>
                  <div className="w-5 h-5 rounded-full border-4 border-primary"></div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl border bg-white cursor-not-allowed opacity-50">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="font-medium">Thanh toán khi nhận hàng (Không áp dụng cho thuê)</span>
                  </div>
                  <div className="w-5 h-5 rounded-full border border-gray-300"></div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-3xl border p-6 shadow-sm">
              <h3 className="font-bold text-lg mb-4">Tóm tắt đơn hàng ({cartItems.length} sản phẩm)</h3>
              <div className="divide-y">
                {cartItems.map((item) => (
                  <div key={item.cartItemId} className="py-4 flex gap-4">
                    <img src={item.images[0]} className="w-16 h-16 rounded-lg object-cover" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm line-clamp-1">{item.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{item.rentalDates ? 'Thuê (7 ngày)' : 'Mua'}</p>
                    </div>
                    <div className="font-semibold">
                      {formatCurrency(item.rentalDates ? (item.rentPrice * 7) : item.buyPrice)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
          </div>

          {/* Totals Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl border p-6 shadow-sm sticky top-28">
              <h3 className="font-bold text-lg mb-6">Tổng đơn hàng</h3>
              
              <div className="space-y-3 text-sm mb-6 border-b pb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tạm tính</span>
                  <span className="font-medium">{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phí vận chuyển</span>
                  <span className="font-medium">{formatCurrency(30000)}</span>
                </div>
                {hasRentals && (
                  <div className="flex justify-between text-secondary-foreground mt-2 pt-2 border-t border-dashed">
                    <span>Đặt cọc (30% cho thuê)</span>
                    <span className="font-medium">{formatCurrency(depositAmount)}</span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-center mb-8">
                <span className="font-bold text-lg">Tổng cộng</span>
                <span className="font-bold text-2xl text-primary">{formatCurrency(finalTotal + 30000)}</span>
              </div>

              <Button 
                size="lg" 
                className="w-full rounded-full h-14 text-lg shadow-lg shadow-primary/20"
                onClick={handleCheckout}
                disabled={isProcessing}
              >
                {isProcessing ? "Đang xử lý..." : "Đặt hàng qua PayOS"}
              </Button>
              
              <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Thanh toán an toàn qua PayOS
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
