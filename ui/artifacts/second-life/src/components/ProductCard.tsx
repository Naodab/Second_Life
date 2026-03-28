import { Link } from "wouter";
import { Star, MapPin, ShoppingBag, CalendarClock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/product/${product.id}`}>
      <div className="group bg-card border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img 
            src={product.images[0]} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.type === 'buy' || product.type === 'both' ? (
              <Badge className="bg-primary text-white shadow-sm border-none backdrop-blur-md bg-opacity-90 px-3 py-1">Mua</Badge>
            ) : null}
            {product.type === 'rent' || product.type === 'both' ? (
              <Badge className="bg-secondary text-secondary-foreground shadow-sm border-none backdrop-blur-md bg-opacity-90 px-3 py-1">Thuê</Badge>
            ) : null}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <span className="font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md">{product.category}</span>
            <span>•</span>
            <span>{product.condition}</span>
          </div>
          
          <h3 className="font-bold text-foreground line-clamp-2 mb-3 group-hover:text-primary transition-colors flex-1 text-base leading-tight">
            {product.name}
          </h3>

          <div className="space-y-2 mt-auto">
            {product.buyPrice && (
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                <span className="font-bold text-lg">{formatCurrency(product.buyPrice)}</span>
              </div>
            )}
            
            {product.rentPrice && (
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-secondary" />
                <span className="font-bold text-secondary-foreground">
                  {formatCurrency(product.rentPrice)} <span className="text-xs text-muted-foreground font-normal">/ ngày</span>
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[100px]">{product.location}</span>
            </div>
            <div className="flex items-center gap-1 text-amber-500 font-medium">
              <Star className="w-3 h-3 fill-current" />
              <span>{product.rating}</span>
              <span className="text-muted-foreground font-normal">({product.reviewsCount})</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
