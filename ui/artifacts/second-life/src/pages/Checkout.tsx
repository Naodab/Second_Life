import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import {
  CheckCircle2, ShieldCheck, CreditCard, ArrowLeft, Store,
  AlertCircle, MapPin, Clock, Package, Info, Loader2, QrCode,
  Smartphone, ChevronDown, ChevronUp, Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn } from "@/lib/utils";
import { useCart, getPendingCheckout, clearPendingCheckout, CheckoutSelection } from "@/hooks/use-mock-api";
import { MOCK_FACILITIES } from "@/lib/mock-data";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { groupByFacility, itemTotal, itemDays } from "./Checkout/checkout-utils";

/* ── PayOS mock screen ───────────────────────────────────────── */
function PayOSScreen({ amount, onSuccess }: { amount: number; onSuccess: () => void }) {
  const [countdown, setCountdown] = useState(8);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  const orderCode = useRef(Math.floor(Math.random() * 9000 + 1000));

  useEffect(() => {
    ref.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(ref.current!); onSuccess(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current!);
  }, [onSuccess]);

  return (
    <div className="min-h-screen bg-[#0e3a6c] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-8 text-center shadow-2xl">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="bg-[#0e3a6c] rounded-xl px-3 py-1.5">
            <span className="text-white font-bold text-sm tracking-widest">PayOS</span>
          </div>
        </div>
        <p className="text-muted-foreground text-sm mb-1">Số tiền cần thanh toán</p>
        <p className="text-4xl font-bold text-[#0e3a6c] mb-6">{formatCurrency(amount)}</p>

        <div className="bg-gray-50 rounded-2xl p-4 mb-6 flex flex-col items-center gap-2">
          <QrCode className="w-24 h-24 text-gray-800 opacity-80" strokeWidth={1.2} />
          <p className="text-xs text-muted-foreground">Quét mã QR bằng app ngân hàng</p>
        </div>

        <div className="p-3 bg-blue-50 rounded-xl mb-5 text-left">
          <div className="flex items-center gap-2 mb-1">
            <Smartphone className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <p className="text-xs font-semibold text-blue-800">Chuyển khoản ngân hàng</p>
          </div>
          <p className="text-xs text-muted-foreground">MB Bank · 1234 5678 9012</p>
          <p className="text-xs text-muted-foreground">Nội dung: SECONDLIFE {orderCode.current}</p>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Đang chờ xác nhận... ({countdown}s)</span>
        </div>

        <p className="text-[10px] text-muted-foreground">
          <ShieldCheck className="inline w-3 h-3 mr-1" />
          Giao dịch được bảo mật bởi PayOS & SSL 256-bit
        </p>
      </div>
    </div>
  );
}

/* ── Success screen ──────────────────────────────────────────── */
function SuccessScreen({ subOrderCount }: { subOrderCount: number }) {
  const [, setLocation] = useLocation();
  const [counter, setCounter] = useState(5);

  useEffect(() => {
    const t = setInterval(() => setCounter(c => {
      if (c <= 1) { clearInterval(t); setLocation('/'); return 0; }
      return c - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-white p-4">
      <div className="text-center max-w-md w-full bg-white p-10 rounded-3xl border shadow-xl animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-14 h-14" />
        </div>
        <h2 className="text-3xl font-display font-bold mb-2 text-green-700">Thanh toán thành công!</h2>
        <p className="text-muted-foreground leading-relaxed mb-1">Đơn hàng đã được ghi nhận.</p>
        <p className="text-sm text-primary font-semibold mb-4">Hãy chờ cơ sở duyệt đơn hàng.</p>
        {subOrderCount > 1 && (
          <p className="text-xs text-muted-foreground mb-4">
            Đơn đã được tách thành <strong>{subOrderCount} đơn nhỏ</strong> theo từng cơ sở.
          </p>
        )}
        <div className="bg-gray-50 rounded-2xl p-4 mb-5 text-sm text-muted-foreground">
          <Package className="w-5 h-5 mx-auto mb-1 text-primary" />
          Theo dõi đơn hàng trong mục <strong>Đơn hàng của tôi</strong>.
        </div>
        <p className="text-xs text-muted-foreground mb-4">Tự động về trang chủ sau <strong>{counter}s</strong></p>
        <div className="flex flex-col gap-3">
          <Button size="lg" className="rounded-full" onClick={() => setLocation('/orders')}>Xem đơn hàng</Button>
          <Button variant="outline" size="lg" className="rounded-full" onClick={() => setLocation('/')}>Về trang chủ</Button>
        </div>
      </div>
    </div>
  );
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { cartItems, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPayOS, setShowPayOS] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [expandedFacilities, setExpandedFacilities] = useState<Record<string, boolean>>({});

  const [items, setItems] = useState<CheckoutSelection[]>(() => {
    const pending = getPendingCheckout();
    if (pending.length > 0) return pending;
    return cartItems.map(ci => ({
      cartItemId: ci.cartItemId,
      productId: ci.productId,
      name: ci.name,
      images: ci.images,
      facilityId: ci.facilityId,
      buyPrice: ci.buyPrice,
      rentPrice: ci.rentPrice,
      mode: (ci.rentalDates ? 'rent' : 'buy') as 'buy' | 'rent',
      quantity: ci.quantity,
      rentalDates: ci.rentalDates,
    }));
  });

  useEffect(() => {
    if (items.length === 0 && !isSuccess && !showPayOS) {
      setLocation('/cart');
    }
  }, [items, isSuccess, showPayOS, setLocation]);

  const facilityGroups = groupByFacility(items);
  const subOrderCount = facilityGroups.size;

  const subtotal = items.reduce((s, i) => s + itemTotal(i), 0);
  const shipping = 30000 * subOrderCount;
  const hasRentals = items.some(i => i.mode === 'rent');
  const rentalSubtotal = items.filter(i => i.mode === 'rent').reduce((s, i) => s + itemTotal(i), 0);
  const deposit = hasRentals ? Math.round(rentalSubtotal * 0.3) : 0;
  const grandTotal = subtotal + shipping + deposit;

  const handlePayOSRedirect = () => {
    setIsProcessing(true);
    setTimeout(() => { setIsProcessing(false); setShowPayOS(true); }, 1500);
  };

  const handlePayOSSuccess = () => {
    clearCart();
    clearPendingCheckout();
    setItems([]);
    setShowPayOS(false);
    setIsSuccess(true);
  };

  if (isSuccess) return <SuccessScreen subOrderCount={subOrderCount} />;
  if (showPayOS) return <PayOSScreen amount={grandTotal} onSuccess={handlePayOSSuccess} />;

  const toggleFacility = (facilityId: string) =>
    setExpandedFacilities((prev) => ({ ...prev, [facilityId]: prev[facilityId] === false ? true : false }));

  return (
    <div className="min-h-screen bg-gray-50/40 pt-6 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <button
          onClick={() => setLocation('/cart')}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại giỏ hàng
        </button>

        <h1 className="text-3xl font-display font-bold mb-8">Thanh toán</h1>

        {subOrderCount > 1 && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-sm">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800">Đơn từ nhiều cơ sở</p>
              <p className="text-amber-700 mt-0.5">
                Sản phẩm từ <strong>{subOrderCount} cơ sở</strong> khác nhau — hệ thống sẽ tách thành{" "}
                <strong>{subOrderCount} đơn hàng riêng</strong>.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">

            <div className="bg-white rounded-3xl border p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg">Địa chỉ giao hàng</h3>
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
                <p className="font-semibold">Nguyễn Văn A</p>
                <p className="text-sm text-muted-foreground mt-1">+84 90 123 4567</p>
                <p className="text-sm text-muted-foreground mt-0.5">123 Đường ABC, Phường 1, Quận 1, TP. Hồ Chí Minh</p>
              </div>
            </div>

            {Array.from(facilityGroups.entries()).map(([facilityId, facilityItems], idx) => {
              const facility = MOCK_FACILITIES.find((f) => f.id === facilityId);
              const facilitySubtotal = facilityItems.reduce((s, i) => s + itemTotal(i), 0);
              const isExpanded = expandedFacilities[facilityId] !== false;

              return (
                <div key={facilityId} className="bg-white rounded-3xl border shadow-sm overflow-hidden">
                  <div
                    className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50/60 transition-colors"
                    onClick={() => toggleFacility(facilityId)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Store className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">{facility?.name ?? facilityId}</p>
                        {subOrderCount > 1 && (
                          <Badge variant="outline" className="text-[10px] px-2 py-0 mt-0.5 font-medium text-primary border-primary/30">
                            Đơn #{idx + 1}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-primary">{formatCurrency(facilitySubtotal)}</span>
                      {isExpanded
                        ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-5 border-t divide-y">
                      {facilityItems.map(item => {
                        const days = itemDays(item);
                        const price = itemTotal(item);
                        return (
                          <div key={item.cartItemId} className="py-4 flex gap-4">
                            <img src={item.images[0]} className="w-16 h-16 rounded-xl object-cover border flex-shrink-0" alt={item.name} />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm line-clamp-1">{item.name}</h4>
                              {item.mode === 'rent' && item.rentalDates ? (
                                <div className="flex items-center gap-1 mt-1">
                                  <Clock className="w-3 h-3 text-secondary flex-shrink-0" />
                                  <p className="text-xs text-secondary font-medium">
                                    Thuê {days} ngày ({format(item.rentalDates.start, 'dd/MM', { locale: vi })} – {format(item.rentalDates.end, 'dd/MM/yyyy', { locale: vi })})
                                  </p>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 mt-1">
                                  <Tag className="w-3 h-3 text-primary flex-shrink-0" />
                                  <p className="text-xs text-primary font-medium">Mua đứt</p>
                                </div>
                              )}
                              <p className="text-xs text-muted-foreground mt-0.5">Số lượng: {item.quantity}</p>
                              {item.mode === 'rent' && days > 0 && (
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  {formatCurrency(item.rentPrice)}/ngày × {days} ngày × {item.quantity} sp
                                </p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-semibold text-sm">{formatCurrency(price)}</p>
                              {item.mode === 'rent' && <p className="text-[10px] text-muted-foreground mt-1">+cọc 30%</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {hasRentals && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-800 mb-1">Chính sách đặt cọc thuê đồ</p>
                    <ul className="text-sm text-amber-700 space-y-1 leading-relaxed">
                      <li>• Khi thuê đồ, bạn cần <strong>đặt cọc trước 30%</strong> tổng giá trị thuê.</li>
                      <li>• Phần còn lại (<strong>70%</strong>) được thanh toán khi nhận hàng.</li>
                      <li>• Tiền cọc được hoàn trả sau khi trả đồ trong tình trạng tốt.</li>
                      <li>• Nếu đồ bị hư hỏng, cọc có thể bị giữ một phần hoặc toàn bộ.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-3xl border p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg">Phương thức thanh toán</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-2xl border-2 border-primary bg-primary/5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#0e3a6c] rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-[9px] tracking-wider">PayOS</span>
                    </div>
                    <div>
                      <p className="font-semibold text-primary text-sm">PayOS — Chuyển khoản / QR Code</p>
                      <p className="text-xs text-muted-foreground">Hỗ trợ tất cả ngân hàng nội địa</p>
                    </div>
                  </div>
                  <div className="w-5 h-5 rounded-full border-4 border-primary flex-shrink-0" />
                </div>
                <div className={cn("flex items-center justify-between p-4 rounded-2xl border cursor-not-allowed opacity-50", hasRentals && "opacity-30")}>
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Thanh toán khi nhận hàng (COD)</p>
                      {hasRentals && <p className="text-xs text-destructive">Không áp dụng cho đơn thuê đồ</p>}
                    </div>
                  </div>
                  <div className="w-5 h-5 rounded-full border border-gray-300 flex-shrink-0" />
                </div>
              </div>
            </div>

          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl border p-6 shadow-sm sticky top-28">
              <h3 className="font-bold text-lg mb-5">Tóm tắt</h3>

              <div className="space-y-3 text-sm mb-5 pb-5 border-b">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tạm tính ({items.length} lượt)</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Phí vận chuyển{subOrderCount > 1 ? ` (×${subOrderCount})` : ''}
                  </span>
                  <span className="font-medium">{formatCurrency(shipping)}</span>
                </div>
                {hasRentals && (
                  <div className="flex justify-between pt-2 border-t border-dashed border-amber-200">
                    <span className="text-amber-700 font-medium">Đặt cọc thuê (30%)</span>
                    <span className="font-semibold text-amber-700">{formatCurrency(deposit)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-baseline mb-1">
                <span className="font-bold text-base">Tổng cộng</span>
                <span className="font-bold text-2xl text-primary">{formatCurrency(grandTotal)}</span>
              </div>
              {hasRentals && (
                <p className="text-[11px] text-muted-foreground mb-5 text-right">
                  Gồm {formatCurrency(deposit)} tiền cọc
                </p>
              )}
              {!hasRentals && <div className="mb-5" />}

              <Button
                size="lg"
                className="w-full rounded-full h-12 text-base font-semibold shadow-lg shadow-primary/20"
                onClick={handlePayOSRedirect}
                disabled={isProcessing}
              >
                {isProcessing
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang kết nối...</>
                  : <>Đặt hàng qua PayOS</>}
              </Button>

              <p className="text-center text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Thanh toán bảo mật SSL 256-bit
              </p>

              {subOrderCount > 1 && (
                <p className="text-xs text-muted-foreground text-center mt-4 pt-4 border-t">
                  Tách thành <strong>{subOrderCount} đơn hàng</strong> riêng
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
