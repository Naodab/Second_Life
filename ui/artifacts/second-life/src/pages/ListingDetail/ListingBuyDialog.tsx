import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  lineUnitBuyPrice: number;
  buyQty: number;
  onBuyQtyChange: (next: number) => void;
  checkoutDisabled: boolean;
  onCheckout: () => void;
};

export function ListingBuyDialog({
  open,
  onOpenChange,
  heroImageUrl,
  cartBridge,
  variantAxes,
  variantSelection,
  onVariantSelectionChange,
  lineStock,
  lineUnitBuyPrice,
  buyQty,
  onBuyQtyChange,
  checkoutDisabled,
  onCheckout,
}: Props) {
  const showVariantUi = variantAxes.length > 0;
  const showUnitPrice = !showVariantUi ? lineUnitBuyPrice > 0 : lineStock > 0 && lineUnitBuyPrice > 0;
  const lineTotal = showUnitPrice ? lineUnitBuyPrice * buyQty : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "sm:max-w-md rounded-3xl max-h-[90vh] overflow-y-auto",
          "border-border/80 bg-card/95 backdrop-blur-md shadow-2xl dark:border-border/50 dark:bg-card/98 dark:shadow-black/50",
        )}
      >
        <div className="absolute left-0 top-0 h-1 w-full rounded-t-3xl bg-gradient-to-r from-primary/40 via-primary to-primary/40 dark:from-primary/30 dark:via-primary/90 dark:to-primary/30" />
        <DialogHeader className="pt-1">
          <DialogTitle className="text-xl font-display">Mua ngay</DialogTitle>
          <DialogDescription className="sr-only">Chọn tùy chọn (nếu có), số lượng và xác nhận mua</DialogDescription>
        </DialogHeader>
        <div className="py-2 space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-border/60 dark:border-border/50">
            <img
              src={heroImageUrl}
              className="h-20 w-20 shrink-0 rounded-2xl object-cover ring-2 ring-border/50 shadow-sm dark:ring-border/40"
              alt={cartBridge.name}
            />
            <div className="min-w-0">
              <h4 className="font-bold text-foreground line-clamp-2 leading-snug">{cartBridge.name}</h4>
              {!showVariantUi && lineUnitBuyPrice > 0 ? (
                <p className="text-primary font-bold text-xl mt-1.5 tabular-nums">{formatCurrency(lineUnitBuyPrice)}</p>
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
                  <p className="mt-1.5 text-primary font-bold text-lg tabular-nums">{formatCurrency(lineUnitBuyPrice)}</p>
                ) : null}
              </div>
            </>
          ) : null}

          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">Số lượng</span>
            <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-muted/25 px-2 py-1.5 dark:bg-muted/20">
              <button
                type="button"
                onClick={() => onBuyQtyChange(Math.max(1, buyQty - 1))}
                className="rounded-lg p-1.5 transition-colors hover:bg-accent disabled:opacity-40"
                disabled={lineStock <= 0 || buyQty <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-bold w-8 text-center tabular-nums">{buyQty}</span>
              <button
                type="button"
                onClick={() => {
                  if (lineStock <= 0) return;
                  onBuyQtyChange(Math.min(lineStock, buyQty + 1));
                }}
                disabled={lineStock <= 0 || buyQty >= lineStock}
                className="rounded-lg p-1.5 transition-colors hover:bg-accent disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex justify-between rounded-2xl bg-muted/45 px-4 py-3.5 text-sm dark:bg-muted/25">
            <span className="text-muted-foreground">Tổng cộng</span>
            {showUnitPrice ? (
              <span className="font-bold text-primary text-base tabular-nums">{formatCurrency(lineTotal)}</span>
            ) : (
              <span className="font-medium text-muted-foreground tabular-nums">—</span>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-full border-border/80">
            Hủy
          </Button>
          <Button onClick={onCheckout} className="rounded-full px-8 shadow-md shadow-primary/15 dark:shadow-primary/10" disabled={checkoutDisabled}>
            Mua ngay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
