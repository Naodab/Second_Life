import { Link } from "wouter";
import { MapPin, ShoppingBag, CalendarClock, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { ListingItemResponse } from "@/api/listing";
import { facilityAvatarUrl } from "@/api/facility";

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

export function ListingCard({ row }: { row: ListingItemResponse }) {
  const href = `/listing/${encodeURIComponent(row.id)}`;
  const band = formatPriceBand(row.minPrice, row.maxPrice);
  const facilityId = row.facilityId?.trim();
  const facilityName = row.facilityName?.trim();
  const address = row.facilityAddress?.trim();
  const subCat = row.primarySubCategoryName?.trim();
  const avatarUrl = facilityAvatarUrl({ imageUrl: row.facilityImageUrl ?? undefined });
  const rating =
    row.averageRating != null && !Number.isNaN(row.averageRating) && row.averageRating > 0
      ? Number(row.averageRating)
      : null;

  const showSellerRow = Boolean(facilityId || facilityName || row.facilityImageUrl?.trim());

  return (
    <Link href={href}>
      <div className="group flex h-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm ring-1 ring-transparent transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:ring-primary/20">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={(row.thumbnailImage && row.thumbnailImage.trim()) || DEFAULT_THUMB}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-80" />
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

        <div className="flex min-w-0 flex-1 flex-col p-5">
          {(subCat || row.productName) ? (
            <div className="mb-2 flex min-h-[1.25rem] min-w-0 items-center gap-2 text-xs text-muted-foreground">
              {subCat ? (
                <span className="max-w-[45%] shrink-0 truncate rounded-md bg-primary/10 px-2 py-0.5 font-medium text-primary">
                  {subCat}
                </span>
              ) : null}
              {subCat && row.productName ? <span aria-hidden className="shrink-0 text-border">•</span> : null}
              {row.productName ? (
                <span className="min-w-0 flex-1 truncate font-medium text-foreground/80">SP: {row.productName}</span>
              ) : null}
            </div>
          ) : null}

          <h3 className="mb-3 line-clamp-2 min-w-0 flex-1 break-words text-base font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
            {row.title}
          </h3>

          <div className="mt-auto space-y-2">
            {(row.listingType === "BUY" || row.listingType === "RENT") && band ? (
              row.listingType === "RENT" ? (
                <div className="flex min-w-0 items-center gap-2">
                  <CalendarClock className="h-4 w-4 shrink-0 text-secondary" />
                  <span className="min-w-0 truncate font-bold text-secondary-foreground">
                    {band} <span className="text-xs font-normal text-muted-foreground">(khoảng giá)</span>
                  </span>
                </div>
              ) : (
                <div className="flex min-w-0 items-center gap-2">
                  <ShoppingBag className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 truncate text-lg font-bold text-foreground">{band}</span>
                </div>
              )
            ) : band ? (
              <div className="flex min-w-0 items-center gap-2">
                <ShoppingBag className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 truncate text-lg font-bold text-foreground">{band}</span>
              </div>
            ) : null}
          </div>

          {showSellerRow || address ? (
            <div className="mt-4 flex items-stretch gap-2.5 border-t border-border/70 pt-3">
              {showSellerRow ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="w-10 shrink-0 self-stretch rounded-md object-cover ring-1 ring-border"
                />
              ) : null}
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
                {showSellerRow ? (
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold leading-snug text-foreground">
                      {facilityName ?? "Cơ sở"}
                    </span>
                    {rating != null ? (
                      <span className="flex shrink-0 items-center gap-0.5 text-amber-500">
                        <Star className="h-3 w-3 fill-current" />
                        <span className="text-xs font-medium">{rating.toFixed(1)}</span>
                      </span>
                    ) : null}
                  </div>
                ) : null}
                {address ? (
                  <div className="flex items-start justify-between gap-2 text-[11px] leading-snug text-muted-foreground">
                    <div className="flex min-w-0 flex-1 items-start gap-1">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                      <span className="line-clamp-2">{address}</span>
                    </div>
                    {rating != null && !showSellerRow ? (
                      <span className="flex shrink-0 items-center gap-0.5 text-amber-500">
                        <Star className="h-3 w-3 fill-current" />
                        <span className="text-xs font-medium">{rating.toFixed(1)}</span>
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          ) : rating != null ? (
            <div className="mt-4 flex items-center justify-end gap-0.5 border-t border-border/70 pt-3 text-amber-500">
              <Star className="h-3 w-3 fill-current" />
              <span className="text-xs font-medium">{rating.toFixed(1)}</span>
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
