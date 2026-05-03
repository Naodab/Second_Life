import { Link } from "wouter";
import { Star, MapPin, ShoppingBag, CalendarClock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href="/search">
      <div className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm ring-1 ring-transparent transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:ring-primary/20">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-80" />
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.type === "buy" || product.type === "both" ? (
              <Badge className="border-none bg-primary/95 px-3 py-1 text-primary-foreground shadow-sm backdrop-blur-md">Mua</Badge>
            ) : null}
            {product.type === "rent" || product.type === "both" ? (
              <Badge className="border-none bg-secondary/95 px-3 py-1 text-secondary-foreground shadow-sm backdrop-blur-md">Thuê</Badge>
            ) : null}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-5">
          <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
            <span className="line-clamp-1 rounded-md bg-primary/10 px-2 py-0.5 font-medium text-primary">{product.subCategoryName}</span>
            <span>•</span>
            <span>{product.condition}</span>
          </div>

          <h3 className="mb-3 flex-1 text-base font-bold leading-tight text-foreground line-clamp-2 transition-colors group-hover:text-primary">
            {product.name}
          </h3>

          <div className="mt-auto space-y-2">
            {product.buyPrice && (
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-bold">{formatCurrency(product.buyPrice)}</span>
              </div>
            )}

            {product.rentPrice && (
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-secondary" />
                <span className="font-bold text-secondary-foreground">
                  {formatCurrency(product.rentPrice)} <span className="text-xs font-normal text-muted-foreground">/ ngày</span>
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-4 text-xs text-muted-foreground">
            <div className="flex min-w-0 items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="max-w-[110px] truncate">{product.location}</span>
            </div>
            <div className="flex shrink-0 items-center gap-1 font-medium text-amber-500">
              <Star className="h-3 w-3 fill-current" />
              <span>{product.rating}</span>
              <span className="font-normal text-muted-foreground">({product.reviewsCount})</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
