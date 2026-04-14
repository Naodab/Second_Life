import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import {
  MapPin,
  ShieldCheck,
  Store,
  Calendar,
  MessageSquare,
  Info,
  Plus,
  Minus,
  Package,
  Clock,
  AlertCircle,
  CheckCircle2,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProduct, useCart, checkRentAvailability } from "@/hooks/use-mock-api";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { ImageSlider } from "./ImageSlider";
import { RecommendSlider } from "./RecommendSlider";
import { ReviewMediaLightbox } from "./ReviewMediaLightbox";
import { StarDisplay } from "./StarDisplay";

export default function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const productId = params?.id || "";
  const { data: product, shop, reviews, recommended, isLoading } = useProduct(productId);

  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [buyQty, setBuyQty] = useState(1);
  const [rentStartDate, setRentStartDate] = useState("");
  const [rentEndDate, setRentEndDate] = useState("");
  const [rentQty, setRentQty] = useState(1);
  const [rentValidating, setRentValidating] = useState(false);
  const [rentError, setRentError] = useState<string | null>(null);
  const [rentValid, setRentValid] = useState(false);
  const [reviewLightbox, setReviewLightbox] = useState<{ media: string[]; idx: number } | null>(null);

  const { addToCart } = useCart();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleCheckoutNow = (mode: "buy" | "rent") => {
    if (!product) return;
    addToCart(
      product,
      mode === "buy" ? buyQty : rentQty,
      mode === "rent" && rentStartDate && rentEndDate
        ? { start: new Date(rentStartDate), end: new Date(rentEndDate) }
        : undefined
    );
    setIsBuyModalOpen(false);
    setIsRentModalOpen(false);
    setRentError(null);
    setRentValid(false);
    navigate("/checkout");
  };

  const handleQuickAddToCart = () => {
    if (!product) return;
    addToCart(product, 1);
    toast({ title: "Đã thêm vào giỏ hàng!", description: `${product.name} đã được thêm vào giỏ.` });
  };

  const handleRentCheck = async () => {
    if (!product) return;
    setRentValidating(true);
    setRentError(null);
    setRentValid(false);
    const result = await checkRentAvailability(product.id, rentStartDate, rentEndDate, rentQty);
    setRentValidating(false);
    if (result.available) {
      setRentValid(true);
    } else {
      setRentError(result.message || "Không hợp lệ.");
    }
  };

  const rentDays =
    rentStartDate && rentEndDate
      ? Math.max(0, Math.ceil((new Date(rentEndDate).getTime() - new Date(rentStartDate).getTime()) / 86400000))
      : 0;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-4">
            <Skeleton className="aspect-square rounded-3xl" />
            <div className="flex gap-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-20 h-20 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-7 space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-14 w-full rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return <div className="text-center py-20 text-2xl font-bold">Không tìm thấy sản phẩm</div>;

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : product.rating;

  return (
    <div className="min-h-screen bg-gray-50/30 pb-20">
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-sm text-muted-foreground flex gap-2">
          <Link href="/" className="hover:text-primary">
            Trang chủ
          </Link>
          <span>/</span>
          <Link href={`/search?category=${product.category}`} className="hover:text-primary">
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <ImageSlider images={product.images} productName={product.name} />
          </div>

          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-white rounded-3xl border p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                  {product.category}
                </Badge>
                <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
                  Tình trạng: {product.condition}
                </Badge>
              </div>

              <h1 className="text-3xl font-display font-bold text-foreground mb-3 leading-tight">{product.name}</h1>

              <p className="text-muted-foreground leading-relaxed mb-6 whitespace-pre-line text-sm">{product.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {(product.type === "buy" || product.type === "both") && product.buyPrice && (
                  <div className="border rounded-2xl p-5 bg-gradient-to-br from-white to-primary/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                      MUA
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Giá bán</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(product.buyPrice)}</p>
                    {product.aiSuggestedBuyPrice && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-primary bg-primary/10 w-max px-2 py-1 rounded-md">
                        <ShieldCheck className="w-3 h-3" />
                        <span>AI gợi ý: {formatCurrency(product.aiSuggestedBuyPrice)}</span>
                      </div>
                    )}
                  </div>
                )}
                {(product.type === "rent" || product.type === "both") && product.rentPrice && (
                  <div className="border rounded-2xl p-5 bg-gradient-to-br from-white to-secondary/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-secondary text-secondary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                      THUÊ
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Giá thuê / ngày</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(product.rentPrice)}</p>
                    {product.aiSuggestedRentPrice && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-secondary-foreground bg-secondary/20 w-max px-2 py-1 rounded-md">
                        <ShieldCheck className="w-3 h-3" />
                        <span>AI gợi ý: {formatCurrency(product.aiSuggestedRentPrice)}/ngày</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm mb-6 pb-6 border-b">
                <div className="flex items-center gap-2">
                  <StarDisplay rating={avgRating} size="md" />
                  <span className="font-semibold">{avgRating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({product.reviewsCount} đánh giá)</span>
                </div>
                <span className="text-muted-foreground">•</span>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Package className="w-4 h-4" />
                  <span>
                    Còn lại: <strong className="text-foreground">{product.stock}</strong>
                  </span>
                </div>
                <span className="text-muted-foreground">•</span>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{product.location}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {(product.type === "rent" || product.type === "both") && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1 rounded-full h-12 border-2 border-secondary text-secondary-foreground hover:bg-secondary/10"
                    onClick={() => {
                      setIsRentModalOpen(true);
                      setRentError(null);
                      setRentValid(false);
                    }}
                  >
                    <Calendar className="w-4 h-4 mr-2" /> Thuê ngay
                  </Button>
                )}
                {(product.type === "buy" || product.type === "both") && (
                  <Button size="lg" className="flex-1 rounded-full h-12 shadow-lg shadow-primary/20" onClick={() => setIsBuyModalOpen(true)}>
                    Mua ngay
                  </Button>
                )}
                <Button size="lg" variant="outline" className="flex-1 rounded-full h-12" onClick={handleQuickAddToCart}>
                  <ShoppingCart className="w-4 h-4 mr-2" /> Thêm vào giỏ
                </Button>
              </div>
            </div>

            {shop && (
              <div className="bg-white rounded-3xl border p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img src={shop.avatar} alt={shop.name} className="w-16 h-16 rounded-full object-cover border-2 border-primary/20" />
                    <div>
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        {shop.name}
                        {shop.isVerified && <ShieldCheck className="w-4 h-4 text-primary" />}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>
                          {shop.address}, {shop.ward}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <span className="font-medium text-foreground">{shop.province}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link href="/messages">
                      <Button variant="outline" size="sm" className="rounded-full">
                        <MessageSquare className="w-4 h-4 mr-1" /> Chat ngay
                      </Button>
                    </Link>
                    <Link href={`/shop/${shop.id}`}>
                      <Button size="sm" className="rounded-full bg-primary/10 text-primary hover:bg-primary/20 border-0 shadow-none">
                        <Store className="w-4 h-4 mr-1" /> Xem shop
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    <span>
                      <strong className="text-foreground">{shop.totalOrders}</strong> đơn đã hoàn thành
                    </span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Tham gia {formatDistanceToNow(new Date(shop.joinedDate), { locale: vi, addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 bg-white rounded-3xl border p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-display font-bold">Đánh giá sản phẩm</h2>
              <p className="text-muted-foreground text-sm mt-1">{reviews.length} đánh giá từ người mua</p>
            </div>
            <div className="ml-auto flex items-center gap-3 bg-amber-50 px-5 py-3 rounded-2xl border border-amber-200">
              <span className="text-4xl font-bold text-amber-500">{avgRating.toFixed(1)}</span>
              <div>
                <StarDisplay rating={avgRating} size="md" />
                <p className="text-xs text-muted-foreground mt-1">{product.reviewsCount} đánh giá</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {reviews.map((review) => {
              const allMedia = [...(review.images || []), ...(review.videos || [])];
              return (
                <div key={review.id} className="pb-6 border-b last:border-0 last:pb-0">
                  <div className="flex items-center gap-3 mb-3">
                    <img src={review.userAvatar} className="w-10 h-10 rounded-full object-cover border" alt={review.userName} />
                    <div>
                      <h4 className="font-semibold text-sm">{review.userName}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StarDisplay rating={review.rating} />
                        <span className="text-xs text-muted-foreground">{review.date}</span>
                      </div>
                    </div>
                  </div>
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mb-3 ml-13 flex-wrap">
                      {review.images.map((img, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setReviewLightbox({ media: allMedia, idx: i })}
                          className="w-20 h-20 rounded-xl overflow-hidden border hover:opacity-90 transition-opacity flex-shrink-0"
                        >
                          <img src={img} alt="Ảnh review" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-muted-foreground text-sm ml-13">{review.comment}</p>
                </div>
              );
            })}
          </div>
        </div>

        {recommended.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-display font-bold mb-6">Sản phẩm tương tự</h2>
            <RecommendSlider products={recommended} />
          </div>
        )}
      </div>

      <Dialog open={isBuyModalOpen} onOpenChange={setIsBuyModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Mua ngay</DialogTitle>
            <DialogDescription className="sr-only">Chọn số lượng và xác nhận mua</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b">
              <img src={product.images[0]} className="w-20 h-20 rounded-xl object-cover border" alt={product.name} />
              <div>
                <h4 className="font-bold line-clamp-2">{product.name}</h4>
                <p className="text-primary font-bold text-xl mt-1">{formatCurrency(product.buyPrice || 0)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Số lượng</span>
              <div className="flex items-center gap-3 border rounded-xl px-2 py-1">
                <button type="button" onClick={() => setBuyQty((q) => Math.max(1, q - 1))} className="p-1 rounded-lg hover:bg-gray-100">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-bold w-8 text-center">{buyQty}</span>
                <button type="button" onClick={() => setBuyQty((q) => Math.min(product.stock, q + 1))} className="p-1 rounded-lg hover:bg-gray-100">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="mt-4 bg-gray-50 rounded-xl p-3 flex justify-between text-sm">
              <span className="text-muted-foreground">Tổng cộng</span>
              <span className="font-bold text-primary text-base">{formatCurrency((product.buyPrice || 0) * buyQty)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBuyModalOpen(false)} className="rounded-full">
              Hủy
            </Button>
            <Button onClick={() => handleCheckoutNow("buy")} className="rounded-full px-8">
              Mua ngay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isRentModalOpen}
        onOpenChange={(v) => {
          setIsRentModalOpen(v);
          if (!v) {
            setRentError(null);
            setRentValid(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Thuê ngay</DialogTitle>
            <DialogDescription className="sr-only">Chọn ngày thuê và xác nhận</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-4 mb-5 pb-5 border-b">
              <img src={product.images[0]} className="w-16 h-16 rounded-xl object-cover border" alt={product.name} />
              <div>
                <h4 className="font-bold line-clamp-2">{product.name}</h4>
                <p className="text-secondary-foreground font-semibold mt-1">
                  {formatCurrency(product.rentPrice || 0)} <span className="text-xs font-normal text-muted-foreground">/ ngày</span>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Ngày bắt đầu</label>
                  <Input
                    type="date"
                    value={rentStartDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => {
                      setRentStartDate(e.target.value);
                      setRentValid(false);
                      setRentError(null);
                    }}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Ngày kết thúc</label>
                  <Input
                    type="date"
                    value={rentEndDate}
                    min={rentStartDate || new Date().toISOString().split("T")[0]}
                    onChange={(e) => {
                      setRentEndDate(e.target.value);
                      setRentValid(false);
                      setRentError(null);
                    }}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">Số lượng</span>
                <div className="flex items-center gap-3 border rounded-xl px-2 py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setRentQty((q) => Math.max(1, q - 1));
                      setRentValid(false);
                      setRentError(null);
                    }}
                    className="p-1 rounded-lg hover:bg-gray-100"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold w-8 text-center">{rentQty}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setRentQty((q) => Math.min(product.stock, q + 1));
                      setRentValid(false);
                      setRentError(null);
                    }}
                    className="p-1 rounded-lg hover:bg-gray-100"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {rentDays > 0 && (
                <div className="bg-gray-50 rounded-xl p-3 text-sm">
                  <div className="flex justify-between text-muted-foreground mb-1">
                    <span>Thời gian thuê</span>
                    <span className="font-medium text-foreground">{rentDays} ngày</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tổng dự kiến</span>
                    <span className="font-bold text-primary">{formatCurrency((product.rentPrice || 0) * rentDays * rentQty)}</span>
                  </div>
                </div>
              )}

              {rentError && (
                <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl p-3 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{rentError}</span>
                </div>
              )}

              {rentValid && (
                <div className="flex items-start gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl p-3 text-sm">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Thời gian và số lượng hợp lệ! Bạn có thể thêm vào giỏ.</span>
                </div>
              )}

              {!rentValid && (
                <Button
                  onClick={handleRentCheck}
                  disabled={!rentStartDate || !rentEndDate || rentValidating}
                  variant="outline"
                  className="w-full rounded-xl"
                  size="sm"
                >
                  {rentValidating ? "Đang kiểm tra..." : "Kiểm tra thời gian"}
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRentModalOpen(false)} className="rounded-full">
              Hủy
            </Button>
            <Button
              onClick={() => handleCheckoutNow("rent")}
              disabled={!rentValid}
              className="rounded-full px-8 bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              Thuê ngay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {reviewLightbox && (
        <ReviewMediaLightbox media={reviewLightbox.media} startIdx={reviewLightbox.idx} onClose={() => setReviewLightbox(null)} />
      )}
    </div>
  );
}
