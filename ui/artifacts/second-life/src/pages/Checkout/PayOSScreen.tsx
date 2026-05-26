import { useState, useEffect, useRef } from "react";
import { QrCode, Smartphone, Loader2, ShieldCheck } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { checkoutSectionClass } from "./checkout-utils";

export function PayOSScreen({ amount, onSuccess }: { amount: number; onSuccess: () => void }) {
  const [countdown, setCountdown] = useState(8);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  const orderCode = useRef(Math.floor(Math.random() * 9000 + 1000));

  useEffect(() => {
    ref.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(ref.current!);
          onSuccess();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current!);
  }, [onSuccess]);

  return (
    <div className="min-h-screen bg-[#0e3a6c] flex items-center justify-center p-4">
      <div className={cn(checkoutSectionClass, "max-w-sm w-full p-8 text-center shadow-2xl")}>
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="bg-[#0e3a6c] rounded-xl px-3 py-1.5">
            <span className="text-white font-bold text-sm tracking-widest">PayOS</span>
          </div>
        </div>
        <p className="text-muted-foreground text-sm mb-1">Số tiền cần thanh toán</p>
        <p className="text-4xl font-bold mb-6 text-[#0e3a6c] dark:text-[#7eb8e8]">
          {formatCurrency(amount)}
        </p>

        <div className="bg-muted/50 dark:bg-muted/40 rounded-2xl p-4 mb-6 flex flex-col items-center gap-2">
          <QrCode className="w-24 h-24 text-foreground opacity-80" strokeWidth={1.2} />
          <p className="text-xs text-muted-foreground">Quét mã QR bằng app ngân hàng</p>
        </div>

        <div className="p-3 rounded-xl mb-5 text-left border border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-500/35 dark:bg-blue-500/12 dark:text-blue-50">
          <div className="flex items-center gap-2 mb-1">
            <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-300 flex-shrink-0" />
            <p className="text-xs font-semibold">Chuyển khoản ngân hàng</p>
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
