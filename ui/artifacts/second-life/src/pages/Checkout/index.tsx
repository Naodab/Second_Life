import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  AlertCircle,
  Clock,
  Info,
  Loader2,
  Tag,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { createBookingOrder, buildDefaultPickupTime } from "@/api/booking";
import { createRentalOrder, formatRentalDateTime } from "@/api/rental";
import { buildCheckoutSuccessContext, type CheckoutSuccessContext } from "./checkout-success-context";
import { SuccessScreen } from "./SuccessScreen";
import { CheckoutOrderInfoForm, type CheckoutOrderInfoFormRef } from "./CheckoutOrderInfoForm";
import { CheckoutFacilityCollapseHeader, CheckoutSellerInfoPanel } from "./CheckoutFacilityHeader";
import { ApiErrorState } from "@/components/errors";
import { useCheckoutPage } from "./useCheckoutPage";
import {
  groupByFacility,
  itemTotal,
  itemDuration,
  rentUnitLabelVu,
  checkoutSectionClass,
  checkoutSectionShellClass,
  checkoutAlertClass,
  checkoutRentAccentClass,
  checkoutPrimaryTextClass,
} from "./checkout-utils";

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { items, isLoading, isError, errorView, ownerNameLoading, placeNamesLoading, clearSession, refetch } =
    useCheckoutPage();
  const [successContext, setSuccessContext] = useState<CheckoutSuccessContext | null>(null);
  const [expandedFacilities, setExpandedFacilities] = useState<Record<string, boolean>>({});
  const orderInfoFormRef = useRef<CheckoutOrderInfoFormRef>(null);

  const facilityGroups = groupByFacility(items);
  const subOrderCount = facilityGroups.size;

  const subtotal = items.reduce((s, i) => s + itemTotal(i), 0);
  const hasRentals = items.some((i) => i.mode === "rent");

  const placeOrderMutation = useMutation({
    mutationFn: async (payload: { customerId: string; orderItems: typeof items; orderSubCount: number }) => {
      const pickupTime = buildDefaultPickupTime();
      const orders = await Promise.all(
        payload.orderItems.map((item) => {
          if (item.mode === "rent") {
            if (!item.rentalDates) throw new Error("Thiếu thông tin ngày thuê");
            return createRentalOrder({
              listingVariantId: item.listingVariantId,
              customerId: payload.customerId,
              startTime: formatRentalDateTime(item.rentalDates.start),
              endTime: formatRentalDateTime(item.rentalDates.end),
              quantity: item.quantity,
            });
          }
          return createBookingOrder({
            listingVariantId: item.listingVariantId,
            quantity: item.quantity,
            pickupTime,
            customerId: payload.customerId,
          });
        }),
      );
      return { orders, orderItems: payload.orderItems, orderSubCount: payload.orderSubCount };
    },
    onSuccess: (result) => {
      setSuccessContext(buildCheckoutSuccessContext(result.orderItems, result.orderSubCount));
      clearSession();
    },
  });

  const handlePlaceOrder = async () => {
    const result = await orderInfoFormRef.current?.validate();
    if (!result) return;
    placeOrderMutation.mutate({ customerId: result.customerId, orderItems: items, orderSubCount: subOrderCount });
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    setLocation("/");
  };

  if (successContext) return <SuccessScreen context={successContext} />;

  const toggleFacility = (facilityId: string) =>
    setExpandedFacilities((prev) => ({ ...prev, [facilityId]: prev[facilityId] === false ? true : false }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 pt-6 pb-24 dark:to-muted/15">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[50vh] gap-4 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (isError && errorView) {
    return (
      <ApiErrorState
        variant="fullscreen"
        model={errorView}
        onBack={handleGoBack}
        onRetry={refetch}
        homeHref="/"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 pt-6 pb-24 dark:to-muted/15">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={handleGoBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Trở lại
        </button>

        <h1 className="text-3xl font-display font-bold mb-8">Thanh toán</h1>

        {subOrderCount > 1 && (
          <div className={cn(checkoutAlertClass, "flex items-start gap-3 p-4 mb-6")}>
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Đơn từ nhiều cơ sở</p>
              <p className="mt-0.5 opacity-90">
                Sản phẩm từ <strong>{subOrderCount} cơ sở</strong> khác nhau — hệ thống sẽ tách thành{" "}
                <strong>{subOrderCount} đơn hàng riêng</strong>.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <CheckoutOrderInfoForm ref={orderInfoFormRef} />

            {Array.from(facilityGroups.entries()).map(([facilityId, facilityItems], idx) => {
              const facilitySubtotal = facilityItems.reduce((s, i) => s + itemTotal(i), 0);
              const isExpanded = expandedFacilities[facilityId] !== false;

              return (
                <div key={facilityId} className={checkoutSectionShellClass}>
                  <div
                    role="button"
                    tabIndex={0}
                    className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => toggleFacility(facilityId)}
                    onKeyDown={(e) => e.key === "Enter" && toggleFacility(facilityId)}
                  >
                    <CheckoutFacilityCollapseHeader
                      item={facilityItems[0]}
                      subOrderIndex={idx}
                      showSubOrderBadge={subOrderCount > 1}
                      ownerNameLoading={ownerNameLoading}
                    />
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={cn("text-sm font-semibold", checkoutPrimaryTextClass)}>
                        {formatCurrency(facilitySubtotal)}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border">
                      <CheckoutSellerInfoPanel
                        item={facilityItems[0]}
                        ownerNameLoading={ownerNameLoading}
                        placeNamesLoading={placeNamesLoading}
                      />
                      <div className="px-5 pb-5 divide-y divide-border border-t border-border/60">
                      {facilityItems.map((item) => {
                        const duration = itemDuration(item);
                        const unitLabel = rentUnitLabelVu(item.rentUnit);
                        const price = itemTotal(item);
                        const isHourly = item.rentUnit === "HOUR";
                        const dateFormatStr = isHourly ? "HH:mm dd/MM/yyyy" : "dd/MM/yyyy";
                        return (
                          <div key={item.lineId} className="py-4 flex gap-4">
                            <img src={item.images[0]} className="w-16 h-16 rounded-xl object-cover border border-border flex-shrink-0" alt={item.name} />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm text-foreground line-clamp-1">{item.name}</h4>
                              {item.mode === "rent" && item.rentalDates ? (
                                <div className={cn("flex items-start gap-1.5 mt-1.5", checkoutRentAccentClass)}>
                                  <Clock className="w-3 h-3 flex-shrink-0 mt-[3px]" />
                                  <div className="flex flex-col gap-0.5">
                                    <p className="text-xs font-semibold">
                                      Thuê {duration} {unitLabel}
                                    </p>
                                    <p className="text-[11px] font-medium">
                                      Nhận:{" "}
                                      <span className="font-semibold">
                                        {format(item.rentalDates.start, isHourly ? "HH:mm" : "dd/MM", { locale: vi })}
                                      </span>
                                      {!isHourly && <>{" — "}{format(item.rentalDates.start, "yyyy", { locale: vi })}</>}
                                      {isHourly && <>{" "}{format(item.rentalDates.start, "dd/MM/yyyy", { locale: vi })}</>}
                                    </p>
                                    <p className="text-[11px] font-medium">
                                      Trả:{" "}
                                      <span className="font-semibold">
                                        {format(item.rentalDates.end, isHourly ? "HH:mm" : "dd/MM", { locale: vi })}
                                      </span>
                                      {!isHourly && <>{" — "}{format(item.rentalDates.end, "yyyy", { locale: vi })}</>}
                                      {isHourly && <>{" "}{format(item.rentalDates.end, "dd/MM/yyyy", { locale: vi })}</>}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 mt-1">
                                  <Tag className="w-3 h-3 text-primary flex-shrink-0" />
                                  <p className={cn("text-xs font-medium", checkoutPrimaryTextClass)}>Mua đứt</p>
                                </div>
                              )}
                              <p className="text-xs text-muted-foreground mt-0.5">Số lượng: {item.quantity}</p>
                              {item.mode === "buy" && item.unitPrice > 0 && (
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  {formatCurrency(item.unitPrice)} × {item.quantity} sp
                                </p>
                              )}
                              {item.mode === "rent" && duration > 0 && (
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  {formatCurrency(item.rentPrice)}/{unitLabel} × {duration} {unitLabel} × {item.quantity} sp
                                </p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-semibold text-sm text-foreground">{formatCurrency(price)}</p>
                              {item.mode === "rent" && <p className="text-[10px] text-muted-foreground mt-1">+cọc 30%</p>}
                            </div>
                          </div>
                        );
                      })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {hasRentals && (
              <div className={cn(checkoutAlertClass, "p-5")}>
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold mb-1">Chính sách đặt cọc thuê đồ</p>
                    <ul className="text-sm space-y-1 leading-relaxed opacity-90">
                      <li>• Khi thuê đồ, bạn cần <strong>đặt cọc trước 30%</strong> tổng giá trị thuê.</li>
                      <li>• Phần còn lại (<strong>70%</strong>) được thanh toán khi nhận hàng.</li>
                      <li>• Tiền cọc được hoàn trả sau khi trả đồ trong tình trạng tốt.</li>
                      <li>• Nếu đồ bị hư hỏng, cọc có thể bị giữ một phần hoặc toàn bộ.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className={cn(checkoutAlertClass, "p-5")}>
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold mb-1">Thanh toán trực tiếp giữa hai bên</p>
                  <p className="text-sm leading-relaxed opacity-90">
                    Second Life chỉ đóng vai trò kết nối. Sau khi đặt hàng thành công, bạn và chủ sản phẩm sẽ tự thỏa thuận về hình thức thanh toán và thời gian nhận hàng.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className={cn(checkoutSectionClass, "sticky top-28")}>
              <h3 className="font-bold text-lg text-foreground mb-5">Tóm tắt</h3>

              <div className="space-y-3 text-sm mb-5 pb-5 border-b border-border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tạm tính ({items.length} lượt)</span>
                  <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline mb-5">
                <span className="font-bold text-base text-foreground">Tổng tham khảo</span>
                <span className={cn("font-bold text-2xl", checkoutPrimaryTextClass)}>{formatCurrency(subtotal)}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mb-4 -mt-3">
                Giá thực tế do hai bên thỏa thuận
              </p>

              {placeOrderMutation.isError && (
                <p className="text-sm text-destructive mb-3 text-center">
                  Đặt hàng thất bại, vui lòng thử lại.
                </p>
              )}

              <Button
                size="lg"
                className="w-full rounded-full h-12 text-base font-semibold shadow-lg shadow-primary/20 dark:shadow-primary/10"
                onClick={() => void handlePlaceOrder()}
                disabled={placeOrderMutation.isPending}
              >
                {placeOrderMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang đặt hàng...
                  </>
                ) : (
                  <>Đặt hàng</>
                )}
              </Button>

              {subOrderCount > 1 && (
                <p className="text-xs text-muted-foreground text-center mt-4 pt-4 border-t border-border">
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
