import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { CheckCircle2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { checkoutSectionClass, checkoutHighlightClass, checkoutPrimaryTextClass } from "./checkout-utils";

export function SuccessScreen({ subOrderCount }: { subOrderCount: number }) {
  const [, setLocation] = useLocation();
  const [counter, setCounter] = useState(5);

  useEffect(() => {
    const t = setInterval(
      () =>
        setCounter((c) => {
          if (c <= 1) {
            clearInterval(t);
            setLocation("/");
            return 0;
          }
          return c - 1;
        }),
      1000
    );
    return () => clearInterval(t);
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4 dark:to-muted/15">
      <div className={cn(checkoutSectionClass, "max-w-md w-full p-10 text-center shadow-xl animate-in zoom-in duration-500")}>
        <div className="w-24 h-24 bg-green-100 text-green-600 dark:bg-green-950/50 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-14 h-14" />
        </div>
        <h2 className="text-3xl font-display font-bold mb-2 text-green-700 dark:text-green-400">Thanh toán thành công!</h2>
        <p className="text-muted-foreground leading-relaxed mb-1">Đơn hàng đã được ghi nhận.</p>
        <p className={cn("text-sm font-semibold mb-4", checkoutPrimaryTextClass)}>Hãy chờ cơ sở duyệt đơn hàng.</p>
        {subOrderCount > 1 && (
          <p className="text-xs text-muted-foreground mb-4">
            Đơn đã được tách thành <strong>{subOrderCount} đơn nhỏ</strong> theo từng cơ sở.
          </p>
        )}
        <div className={cn(checkoutHighlightClass, "mb-5 text-sm text-muted-foreground")}>
          <Package className={cn("w-5 h-5 mx-auto mb-1", checkoutPrimaryTextClass)} />
          Theo dõi đơn hàng trong mục <strong>Đơn hàng của tôi</strong>.
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Tự động về trang chủ sau <strong>{counter}s</strong>
        </p>
        <div className="flex flex-col gap-3">
          <Button size="lg" className="rounded-full" onClick={() => setLocation("/orders")}>
            Xem đơn hàng
          </Button>
          <Button variant="outline" size="lg" className="rounded-full" onClick={() => setLocation("/")}>
            Về trang chủ
          </Button>
        </div>
      </div>
    </div>
  );
}
