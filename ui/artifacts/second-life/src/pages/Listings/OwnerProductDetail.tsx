import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Edit,
  Trash2,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MOCK_REVIEWS, type Product } from "@/lib/mock-data";
import { formatCurrency, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { RentalSchedule } from "./RentalSchedule";

export function OwnerProductDetail({ product, onBack }: { product: Product; onBack: () => void }) {
  const [activeImage, setActiveImage] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const { toast } = useToast();
  const reviews = MOCK_REVIEWS;
  const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

  const prev = () =>
    setActiveImage((i) => (i - 1 + product.images.length) % product.images.length);
  const next = () => setActiveImage((i) => (i + 1) % product.images.length);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="rounded-full">
          <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại
        </Button>
        <h2 className="text-xl font-bold truncate flex-1">{product.name}</h2>
        <Badge
          className={
            isActive ? "bg-green-100 text-green-700 border-none" : "bg-gray-100 text-gray-500 border-none"
          }
        >
          {isActive ? "Đang hoạt động" : "Đã ngưng"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-3">
          <div className="aspect-square rounded-2xl overflow-hidden bg-white border relative group">
            <img src={product.images[activeImage]} alt={product.name} className="w-full h-full object-cover" />
            {product.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto hide-scrollbar">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0",
                    i === activeImage ? "border-primary" : "border-transparent opacity-60"
                  )}
                >
                  <img src={img} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border p-5 shadow-sm">
            <div className="flex gap-2 mb-3 flex-wrap">
              <Badge variant="outline" className="bg-primary/5 text-primary">
                {product.subCategoryName}
              </Badge>
              <Badge variant="outline" className="bg-gray-100 text-gray-600">
                {product.condition}
              </Badge>
            </div>
            <h3 className="text-xl font-bold mb-2">{product.name}</h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{product.description}</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {product.buyPrice && (
                <div className="border rounded-xl p-3 bg-primary/5">
                  <p className="text-xs text-muted-foreground">Giá bán</p>
                  <p className="font-bold text-primary">{formatCurrency(product.buyPrice)}</p>
                  {product.aiSuggestedBuyPrice && (
                    <p className="text-xs text-muted-foreground mt-1">
                      AI: {formatCurrency(product.aiSuggestedBuyPrice)}
                    </p>
                  )}
                </div>
              )}
              {product.rentPrice && (
                <div className="border rounded-xl p-3 bg-secondary/10">
                  <p className="text-xs text-muted-foreground">Giá thuê/ngày</p>
                  <p className="font-bold text-secondary-foreground">{formatCurrency(product.rentPrice)}</p>
                  {product.aiSuggestedRentPrice && (
                    <p className="text-xs text-muted-foreground mt-1">
                      AI: {formatCurrency(product.aiSuggestedRentPrice)}/ngày
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground pb-4 border-b mb-4">
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="font-medium">{avgRating.toFixed(1)}</span>
              </div>
              <span>•</span>
              <span>
                Kho: <strong className="text-foreground">{product.stock}</strong>
              </span>
              <span>•</span>
              <span>{product.reviewsCount} đánh giá</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="rounded-full">
                <Edit className="w-3.5 h-3.5 mr-1.5" /> Chỉnh sửa
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "rounded-full",
                  isActive
                    ? "text-amber-600 border-amber-200 hover:bg-amber-50"
                    : "text-green-600 border-green-200 hover:bg-green-50"
                )}
                onClick={() => {
                  setIsActive(!isActive);
                  toast({
                    title: isActive ? "Đã ngưng hoạt động" : "Đã kích hoạt lại",
                    description: product.name,
                  });
                }}
              >
                <Pause className="w-3.5 h-3.5 mr-1.5" />
                {isActive ? "Ngưng hoạt động" : "Kích hoạt lại"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-destructive border-destructive/30 hover:bg-destructive/10"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Xóa
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border p-5 shadow-sm">
            <h4 className="font-bold mb-3 text-sm">Thống kê sản phẩm</h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-lg font-bold text-primary">12</p>
                <p className="text-xs text-muted-foreground">Lượt xem</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-lg font-bold">{product.reviewsCount}</p>
                <p className="text-xs text-muted-foreground">Đánh giá</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-lg font-bold text-green-600">5</p>
                <p className="text-xs text-muted-foreground">Đơn hoàn thành</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {(product.type === "rent" || product.type === "both") && <RentalSchedule productId={product.id} />}
    </div>
  );
}
