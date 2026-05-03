import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { ListingItemResponse } from "@/api/listing";

const DEFAULT_THUMB =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=480&h=480&fit=crop";

function formatPriceBand(minPrice: number | null, maxPrice: number | null): string | null {
  if (minPrice != null && maxPrice != null) {
    return minPrice === maxPrice
      ? formatCurrency(minPrice)
      : `${formatCurrency(minPrice)} – ${formatCurrency(maxPrice)}`;
  }
  if (minPrice != null) return formatCurrency(minPrice);
  if (maxPrice != null) return formatCurrency(maxPrice);
  return null;
}

export function ListingSearchCard({ row }: { row: ListingItemResponse }) {
  const href = `/product/${encodeURIComponent(row.productId)}`;
  const band = formatPriceBand(row.minPrice, row.maxPrice);

  return (
    <Link href={href}>
      <div className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm ring-1 ring-transparent transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:ring-primary/20">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={(row.thumbnailImage && row.thumbnailImage.trim()) || DEFAULT_THUMB}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {row.listingType === "BUY" ? (
              <Badge className="border-none bg-primary/95 px-3 py-1 text-primary-foreground shadow-sm backdrop-blur-md">
                Mua
              </Badge>
            ) : null}
            {row.listingType === "RENT" ? (
              <Badge className="border-none bg-secondary/95 px-3 py-1 text-secondary-foreground shadow-sm backdrop-blur-md">
                Thuê
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h3 className="mb-3 flex-1 text-base font-bold leading-tight text-foreground line-clamp-2 transition-colors group-hover:text-primary">
            {row.title}
          </h3>
          {row.productName ? (
            <p className="mb-2 line-clamp-1 text-xs text-muted-foreground">SP: {row.productName}</p>
          ) : null}
          {band ? (
            <div className="mt-auto space-y-1">
              <p className="text-lg font-bold text-foreground">{band}</p>
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
