import { Calendar, MapPin, Package, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, cn } from "@/lib/utils";
import type { AttributeDto } from "@/api/listing";
import { StarDisplay } from "./StarDisplay";

type Props = {
  title: string;
  listingDescription: string;
  productDescription: string | undefined | null;
  subName: string;
  conditionLabel: string;
  priceBand: string | null;
  buyPrice: number;
  rentPrice: number;
  listingType: "BUY" | "RENT" | string;
  specAttributes: AttributeDto[];
  avgRating: number;
  reviewCount: number;
  totalStock: number;
  locationLine: string;
  outOfStock: boolean;
  onOpenBuy: () => void;
  onOpenRent: () => void;
  onQuickAddToCart: () => void;
  quickAddLoading?: boolean;
  hideCommerceActions?: boolean;
};

export function ListingProductSummary({
  title,
  listingDescription,
  productDescription,
  subName,
  conditionLabel,
  priceBand,
  buyPrice,
  rentPrice,
  listingType,
  specAttributes,
  avgRating,
  reviewCount,
  totalStock,
  locationLine,
  outOfStock,
  onOpenBuy,
  onOpenRent,
  onQuickAddToCart,
  quickAddLoading,
  hideCommerceActions,
}: Props) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8",
        "ring-1 ring-border/40 dark:border-border/50 dark:bg-card/95 dark:shadow-2xl dark:shadow-black/25 dark:ring-border/30",
      )}
    >
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Badge variant="outline" className="border-primary/25 bg-primary/8 font-medium text-primary dark:bg-primary/12 dark:text-primary">
          {subName}
        </Badge>
        <Badge variant="outline" className="border-border/80 bg-muted/60 font-medium text-muted-foreground dark:bg-muted/25">
          {conditionLabel}
        </Badge>
      </div>

      <h1 className="text-2xl font-display font-bold tracking-tight text-foreground sm:text-3xl mb-4 leading-tight">{title}</h1>

      <p className="text-muted-foreground leading-relaxed mb-8 whitespace-pre-line text-sm sm:text-[15px]">
        {listingDescription.trim() || productDescription?.trim() || "Không có mô tả thêm."}
      </p>

      {priceBand || buyPrice > 0 || rentPrice > 0 ? (
        <div className="mb-8 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.07] to-primary/[0.02] px-5 py-5 sm:px-6 dark:from-primary/15 dark:to-primary/5 dark:border-primary/25">
          <p className="text-3xl sm:text-4xl lg:text-[2.65rem] font-bold tabular-nums leading-tight text-primary">
            {priceBand ?? (listingType === "RENT" ? `${formatCurrency(rentPrice)} / ngày` : formatCurrency(buyPrice))}
          </p>
        </div>
      ) : null}

      {specAttributes.length > 0 ? (
        <div className="mb-8 rounded-2xl border border-border/70 bg-muted/25 px-5 py-4 dark:bg-muted/15">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Đặc điểm theo phiên bản</h3>
          <dl className="space-y-2.5 text-sm">
            {specAttributes.map((attr, idx) => (
              <div key={`${attr.id ?? attr.name}-${idx}`} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3 sm:items-baseline">
                <dt className="font-semibold text-foreground shrink-0 min-w-[7rem]">{attr.name ?? "Thuộc tính"}</dt>
                <dd className="text-muted-foreground">
                  {(attr.attributeValues ?? [])
                    .map((v) => (v.value ?? "").trim())
                    .filter(Boolean)
                    .join(", ")}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 text-sm mb-8 rounded-2xl border border-border/60 bg-muted/30 px-4 py-3.5 dark:bg-muted/15 dark:border-border/50">
        <div className="flex items-center gap-2">
          <StarDisplay rating={avgRating} size="md" />
          <span className="font-semibold text-foreground tabular-nums">{avgRating.toFixed(1)}</span>
          <span className="text-muted-foreground">
            ({reviewCount > 0 ? `${reviewCount} đánh giá` : "cơ sở"})
          </span>
        </div>
        <span className="text-muted-foreground/40 hidden sm:inline" aria-hidden>
          •
        </span>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Package className="w-4 h-4 shrink-0 opacity-80" />
          <span>
            Còn lại: <strong className="tabular-nums text-foreground">{outOfStock ? "—" : totalStock}</strong>
          </span>
        </div>
        <span className="text-muted-foreground/40 hidden sm:inline" aria-hidden>
          •
        </span>
        <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
          <MapPin className="w-4 h-4 shrink-0 opacity-80" />
          <span className="truncate max-w-[220px] sm:max-w-none">{locationLine || "—"}</span>
        </div>
      </div>

      {!hideCommerceActions ? (
      <div className="flex flex-col sm:flex-row gap-3">
        {listingType === "RENT" && (
          <Button
            size="lg"
            variant="outline"
            disabled={outOfStock}
            className="flex-1 h-12 rounded-full border-2 border-secondary/80 text-secondary-foreground transition-all hover:bg-secondary/12 active:scale-[0.99] dark:border-secondary/60 dark:hover:bg-secondary/15"
            onClick={onOpenRent}
          >
            <Calendar className="w-4 h-4 mr-2" /> Thuê ngay
          </Button>
        )}
        {listingType === "BUY" && (
          <Button
            size="lg"
            disabled={outOfStock}
            className="flex-1 h-12 rounded-full shadow-lg shadow-primary/18 transition-all hover:shadow-primary/25 active:scale-[0.99] dark:shadow-primary/10"
            onClick={onOpenBuy}
          >
            Mua ngay
          </Button>
        )}
        <Button
          size="lg"
          variant="outline"
          disabled={outOfStock || quickAddLoading}
          className="flex-1 h-12 rounded-full border-border/80 bg-background/50 transition-all hover:bg-muted/80 active:scale-[0.99] dark:bg-background/30 dark:hover:bg-muted/40"
          onClick={onQuickAddToCart}
        >
          <ShoppingCart className="w-4 h-4 mr-2" /> {quickAddLoading ? "Đang thêm..." : "Thêm vào giỏ"}
        </Button>
      </div>
      ) : null}
    </div>
  );
}
