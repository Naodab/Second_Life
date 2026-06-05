import { useLocation } from "wouter";
import { CheckCircle2, Clock, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ListingSimilarSection } from "@/pages/ListingDetail/ListingSimilarSection";
import {
  checkoutSectionClass,
  checkoutHighlightClass,
  checkoutPrimaryTextClass,
} from "./checkout-utils";
import type { CheckoutSuccessContext } from "./checkout-success-context";
import { useCheckoutSuccessRecommendations } from "./useCheckoutSuccessRecommendations";

export function SuccessScreen({ context }: { context: CheckoutSuccessContext }) {
  const [, setLocation] = useLocation();
  const { subOrderCount, items } = context;
  const anchor = items[0] ?? null;
  const excludeListingIds = items.map((i) => i.listingId);

  const { listingType, similarInfinite, similarItems, showSimilarBlock } =
    useCheckoutSuccessRecommendations(anchor, excludeListingIds);

  const hasRentals = items.some((i) => i.mode === "rent");

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-muted/30 pb-24 dark:to-muted/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="max-w-2xl mx-auto">
          <div
            className={cn(
              checkoutSectionClass,
              "p-8 sm:p-10 text-center shadow-xl animate-in zoom-in duration-500",
            )}
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-100 text-green-600 dark:bg-green-950/50 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 sm:w-14 sm:h-14" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-display font-bold mb-3 text-green-700 dark:text-green-400">
              Đặt hàng thành công!
            </h1>

            <p className="text-muted-foreground leading-relaxed mb-2">
              Đơn hàng của bạn đã được ghi nhận. Vui lòng chờ{" "}
              <strong className="text-foreground">chủ sản phẩm xác nhận</strong> — bạn sẽ được thông báo
              khi đơn được chấp nhận.
            </p>

            <p className={cn("text-sm font-medium mb-4 flex items-center justify-center gap-2", checkoutPrimaryTextClass)}>
              <Clock className="w-4 h-4 shrink-0" />
              Sau khi được duyệt, hai bên sẽ liên hệ để thỏa thuận thanh toán và thời gian nhận hàng.
            </p>

            {subOrderCount > 1 && (
              <p className="text-xs text-muted-foreground mb-4">
                Đã tạo <strong>{subOrderCount} đơn hàng</strong> riêng biệt.
              </p>
            )}

            {hasRentals && (
              <p className="text-xs text-muted-foreground mb-4">
                Đơn thuê sẽ được xử lý riêng theo chính sách của từng cơ sở.
              </p>
            )}

            <div className={cn(checkoutHighlightClass, "mb-6 text-sm text-muted-foreground")}>
              <Package className={cn("w-5 h-5 mx-auto mb-1", checkoutPrimaryTextClass)} />
              Theo dõi trạng thái đơn trong mục <strong>Đơn hàng của tôi</strong>.
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="rounded-full" onClick={() => setLocation("/orders")}>
                Xem đơn hàng
              </Button>
              <Button variant="outline" size="lg" className="rounded-full" onClick={() => setLocation("/")}>
                Về trang chủ
              </Button>
            </div>
          </div>
        </div>

        {showSimilarBlock && (
          <div className="mt-12 sm:mt-16 max-w-7xl">
            <ListingSimilarSection
              show
              listingType={listingType}
              similarInfinite={similarInfinite}
              similarItems={similarItems}
            />
          </div>
        )}
      </div>
    </div>
  );
}
