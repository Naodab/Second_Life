import { AlertCircle, CheckCircle2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatCurrency, cn } from "@/lib/utils";
import type { Product } from "@/lib/mock-data";
import type { AttributeDto } from "@/api/listing";
import { ListingVariantAttributePickers } from "./ListingVariantAttributePickers";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  heroImageUrl: string;
  cartBridge: Product;
  variantAxes: AttributeDto[];
  variantSelection: Record<string, string>;
  onVariantSelectionChange: (axisKey: string, valueId: string) => void;
  lineStock: number;
  lineUnitRentPrice: number;
  rentStartDate: string;
  rentEndDate: string;
  onRentStartDateChange: (value: string) => void;
  onRentEndDateChange: (value: string) => void;
  rentQty: number;
  onRentQtyChange: (next: number) => void;
  rentDays: number;
  rentError: string | null;
  rentValid: boolean;
  checkoutDisabled: boolean;
  onRentCheck: () => void;
  onCheckout: () => void;
};

export function ListingRentDialog({
  open,
  onOpenChange,
  heroImageUrl,
  cartBridge,
  variantAxes,
  variantSelection,
  onVariantSelectionChange,
  lineStock,
  lineUnitRentPrice,
  rentStartDate,
  rentEndDate,
  onRentStartDateChange,
  onRentEndDateChange,
  rentQty,
  onRentQtyChange,
  rentDays,
  rentError,
  rentValid,
  checkoutDisabled,
  onRentCheck,
  onCheckout,
}: Props) {
  const todayIso = new Date().toISOString().split("T")[0];
  const showVariantUi = variantAxes.length > 0;
  const showUnitPrice = !showVariantUi ? lineUnitRentPrice > 0 : lineStock > 0 && lineUnitRentPrice > 0;
  const estimatedTotal = showUnitPrice && rentDays > 0 ? lineUnitRentPrice * rentDays * rentQty : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "sm:max-w-md rounded-3xl max-h-[90vh] overflow-y-auto",
          "border-border/80 bg-card/95 backdrop-blur-md shadow-2xl dark:border-border/50 dark:bg-card/98 dark:shadow-black/50",
        )}
      >
        <div className="absolute left-0 top-0 h-1 w-full rounded-t-3xl bg-gradient-to-r from-secondary/50 via-secondary to-secondary/50 dark:from-secondary/40 dark:via-secondary/90 dark:to-secondary/40" />
        <DialogHeader className="pt-1">
          <DialogTitle className="text-xl font-display">Thuê ngay</DialogTitle>
          <DialogDescription className="sr-only">Chọn tùy chọn (nếu có), ngày thuê và xác nhận</DialogDescription>
        </DialogHeader>
        <div className="py-2 space-y-6">
          <div className="flex items-center gap-4 pb-5 border-b border-border/60 dark:border-border/50">
            <img
              src={heroImageUrl}
              className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-2 ring-border/50 shadow-sm dark:ring-border/40"
              alt={cartBridge.name}
            />
            <div className="min-w-0">
              <h4 className="font-bold text-foreground line-clamp-2 leading-snug">{cartBridge.name}</h4>
              {!showVariantUi && lineUnitRentPrice > 0 ? (
                <p className="text-secondary-foreground font-semibold mt-1.5 tabular-nums">
                  {formatCurrency(lineUnitRentPrice)}{" "}
                  <span className="text-xs font-normal text-muted-foreground">/ ngày (ước tính)</span>
                </p>
              ) : null}
            </div>
          </div>

          {showVariantUi ? (
            <>
              <ListingVariantAttributePickers
                axes={variantAxes}
                selection={variantSelection}
                onChange={onVariantSelectionChange}
              />
              <div className="rounded-2xl border border-border/70 bg-muted/35 px-4 py-3.5 text-sm dark:bg-muted/20 dark:border-border/50">
                <p>
                  <span className="text-muted-foreground">Kho còn: </span>
                  <span className="font-semibold tabular-nums text-foreground">{lineStock}</span>
                </p>
                {showUnitPrice ? (
                  <p className="mt-1.5 font-semibold tabular-nums text-secondary-foreground">
                    {formatCurrency(lineUnitRentPrice)}{" "}
                    <span className="text-xs font-normal text-muted-foreground">/ ngày (ước tính)</span>
                  </p>
                ) : null}
              </div>
            </>
          ) : null}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block text-foreground">Ngày bắt đầu</label>
                <Input
                  type="date"
                  value={rentStartDate}
                  min={todayIso}
                  onChange={(e) => onRentStartDateChange(e.target.value)}
                  className="rounded-xl border-border/80 bg-background/80 dark:bg-background/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block text-foreground">Ngày kết thúc</label>
                <Input
                  type="date"
                  value={rentEndDate}
                  min={rentStartDate || todayIso}
                  onChange={(e) => onRentEndDateChange(e.target.value)}
                  className="rounded-xl border-border/80 bg-background/80 dark:bg-background/50"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm text-foreground">Số lượng</span>
              <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-muted/25 px-2 py-1.5 dark:bg-muted/20">
                <button
                  type="button"
                  onClick={() => onRentQtyChange(Math.max(1, rentQty - 1))}
                  className="rounded-lg p-1.5 transition-colors hover:bg-accent disabled:opacity-40"
                  disabled={lineStock <= 0 || rentQty <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-bold w-8 text-center tabular-nums">{rentQty}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (lineStock <= 0) return;
                    onRentQtyChange(Math.min(lineStock, rentQty + 1));
                  }}
                  disabled={lineStock <= 0 || rentQty >= lineStock}
                  className="rounded-lg p-1.5 transition-colors hover:bg-accent disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {rentDays > 0 && (
              <div className="rounded-2xl bg-muted/45 p-3.5 text-sm dark:bg-muted/25">
                <div className="flex justify-between text-muted-foreground mb-1">
                  <span>Thời gian thuê</span>
                  <span className="font-medium tabular-nums text-foreground">{rentDays} ngày</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tổng dự kiến</span>
                  {showUnitPrice ? (
                    <span className="font-bold text-primary tabular-nums">{formatCurrency(estimatedTotal)}</span>
                  ) : (
                    <span className="font-medium text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            )}

            {rentError && (
              <div className="flex items-start gap-2 rounded-2xl border border-destructive/35 bg-destructive/10 p-3.5 text-sm text-destructive dark:border-destructive/40 dark:bg-destructive/15">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{rentError}</span>
              </div>
            )}

            {rentValid && (
              <div className="flex items-start gap-2 rounded-2xl border border-emerald-600/35 bg-emerald-600/10 p-3.5 text-sm text-emerald-900 dark:border-emerald-500/35 dark:bg-emerald-950/50 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span>Thời gian và số lượng hợp lệ! Bạn có thể thêm vào giỏ.</span>
              </div>
            )}

            {!rentValid ? (
              <Button
                onClick={onRentCheck}
                disabled={!rentStartDate || !rentEndDate}
                variant="outline"
                className="w-full rounded-xl border-border/80"
                size="sm"
              >
                Kiểm tra thời gian
              </Button>
            ) : null}
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full border-border/80">
            Hủy
          </Button>
          <Button
            onClick={onCheckout}
            disabled={checkoutDisabled}
            className="rounded-full px-8 bg-secondary text-secondary-foreground shadow-md shadow-secondary/20 hover:bg-secondary/90 dark:shadow-black/30"
          >
            Thuê ngay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
