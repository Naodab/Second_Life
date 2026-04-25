import { useState, useRef } from "react";
import { useRoute, Link, useLocation } from "wouter";
import {
  Star, MapPin, ShieldCheck, Heart, Share2, Store, Calendar,
  MessageSquare, Info, ChevronLeft, ChevronRight, Plus, Minus,
  X, ZoomIn, Package, Clock, AlertCircle, CheckCircle2, ShoppingCart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProduct, useCart, checkRentAvailability } from "@/hooks/use-mock-api";
import { formatCurrency, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/ProductCard";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

function ImageSlider({ images, productName }: { images: string[]; productName: string }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  const prev = () => setActive(i => (i - 1 + images.length) % images.length);
  const next = () => setActive(i => (i + 1) % images.length);

  const selectThumb = (idx: number) => {
    setActive(idx);
    thumbRef.current?.children[idx]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  return (
    <div className="space-y-4">
      <div className="aspect-square rounded-3xl overflow-hidden bg-white border shadow-sm relative group">
        <img
          src={images[active]}
          alt={productName}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-md hover:bg-white text-foreground shadow-md rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-md hover:bg-white text-foreground shadow-md rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button key={i} onClick={() => selectThumb(i)} className={cn("h-1.5 rounded-full transition-all", i === active ? "bg-white w-5" : "bg-white/50 w-1.5")} />
              ))}
            </div>
          </>
        )}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button variant="secondary" size="icon" className="rounded-full bg-white/80 backdrop-blur-md hover:bg-white text-foreground shadow-sm">
            <Heart className="w-5 h-5" />
          </Button>
          <Button variant="secondary" size="icon" className="rounded-full bg-white/80 backdrop-blur-md hover:bg-white text-foreground shadow-sm">
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
        <button
          onClick={() => setLightbox(active)}
          className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-md hover:bg-white text-foreground shadow-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>

      {images.length > 1 && (
        <div ref={thumbRef} className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar snap-x snap-mandatory">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => selectThumb(idx)}
              className={cn(
                "w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all snap-start",
                active === idx ? "border-primary ring-2 ring-primary/20" : "border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <img src={img} alt={`Ảnh ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightbox !== null && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-gray-300 z-10" onClick={() => setLightbox(null)}>
            <X className="w-8 h-8" />
          </button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-white/10 rounded-full p-3"
            onClick={e => { e.stopPropagation(); setLightbox(i => (i! - 1 + images.length) % images.length); }}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <img
            src={images[lightbox]}
            alt="Xem ảnh"
            className="max-h-[85vh] max-w-[85vw] object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10 bg-white/10 rounded-full p-3"
            onClick={e => { e.stopPropagation(); setLightbox(i => (i! + 1) % images.length); }}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); setLightbox(i); }} className={cn("h-1.5 rounded-full transition-all", i === lightbox ? "bg-white w-5" : "bg-white/40 w-1.5")} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StarDisplay({ rating, max = 5, size = "sm" }: { rating: number; max?: number; size?: "sm" | "md" | "lg" }) {
  const sz = size === "lg" ? "w-5 h-5" : size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";
  return (
    <div className="flex">
      {[...Array(max)].map((_, i) => (
        <Star key={i} className={cn(sz, i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200")} />
      ))}
    </div>
  );
}

function ReviewMediaLightbox({ media, startIdx, onClose }: { media: string[]; startIdx: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIdx);
  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center" onClick={onClose}>
      <button className="absolute top-4 right-4 text-white z-10" onClick={onClose}><X className="w-8 h-8" /></button>
      {media.length > 1 && (
        <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-white/10 rounded-full p-3 z-10"
          onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + media.length) % media.length); }}>
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      <img src={media[idx]} alt="Ảnh đánh giá" className="max-h-[85vh] max-w-[85vw] object-contain rounded-lg" onClick={e => e.stopPropagation()} />
      {media.length > 1 && (
        <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-white/10 rounded-full p-3 z-10"
          onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % media.length); }}>
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}

function RecommendSlider({ products }: { products: any[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  if (!products.length) return null;

  const half = Math.ceil(products.length / 2);
  const row1 = products.slice(0, half);
  const row2 = products.slice(half);

  return (
    <div className="relative">
      <button onClick={() => scroll(-1)} className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white border shadow-md rounded-full p-2 hover:bg-gray-50">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <div ref={ref} className="overflow-x-auto hide-scrollbar space-y-4 pb-2 px-1">
        <div className="flex gap-4" style={{ minWidth: "max-content" }}>
          {row1.map(p => (
            <div key={p.id} className="w-52 flex-shrink-0">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
        {row2.length > 0 && (
          <div className="flex gap-4" style={{ minWidth: "max-content" }}>
            {row2.map(p => (
              <div key={p.id} className="w-52 flex-shrink-0">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </div>
      <button onClick={() => scroll(1)} className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white border shadow-md rounded-full p-2 hover:bg-gray-50">
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

export default function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const productId = params?.id || "";
  const { data: product, facility, reviews, recommended, isLoading } = useProduct(productId);

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

  const handleCheckoutNow = (mode: 'buy' | 'rent') => {
    if (!product) return;
    addToCart(product, mode === 'buy' ? buyQty : rentQty,
      mode === 'rent' && rentStartDate && rentEndDate
        ? { start: new Date(rentStartDate), end: new Date(rentEndDate) }
        : undefined
    );
    setIsBuyModalOpen(false);
    setIsRentModalOpen(false);
    setRentError(null);
    setRentValid(false);
    navigate('/checkout');
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

  const rentDays = rentStartDate && rentEndDate
    ? Math.max(0, Math.ceil((new Date(rentEndDate).getTime() - new Date(rentStartDate).getTime()) / 86400000))
    : 0;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-4">
            <Skeleton className="aspect-square rounded-3xl" />
            <div className="flex gap-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="w-20 h-20 rounded-xl" />)}
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
          <Link href="/" className="hover:text-primary">Trang chủ</Link>
          <span>/</span>
          <Link
            href={`/search?subCategoryId=${encodeURIComponent(product.subCategoryId)}`}
            className="hover:text-primary"
          >
            {product.subCategoryName}
          </Link>
          <span>/</span>
          <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* LEFT: Image Slider */}
          <div className="lg:col-span-5">
            <ImageSlider images={product.images} productName={product.name} />
          </div>

          {/* RIGHT: Product Info */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-white rounded-3xl border p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{product.subCategoryName}</Badge>
                <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">Tình trạng: {product.condition}</Badge>
              </div>

              <h1 className="text-3xl font-display font-bold text-foreground mb-3 leading-tight">{product.name}</h1>

              <p className="text-muted-foreground leading-relaxed mb-6 whitespace-pre-line text-sm">{product.description}</p>

              {/* Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {(product.type === 'buy' || product.type === 'both') && product.buyPrice && (
                  <div className="border rounded-2xl p-5 bg-gradient-to-br from-white to-primary/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">MUA</div>
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
                {(product.type === 'rent' || product.type === 'both') && product.rentPrice && (
                  <div className="border rounded-2xl p-5 bg-gradient-to-br from-white to-secondary/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-secondary text-secondary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-xl">THUÊ</div>
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

              {/* Stars + Stock */}
              <div className="flex items-center gap-4 text-sm mb-6 pb-6 border-b">
                <div className="flex items-center gap-2">
                  <StarDisplay rating={avgRating} size="md" />
                  <span className="font-semibold">{avgRating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({product.reviewsCount} đánh giá)</span>
                </div>
                <span className="text-muted-foreground">•</span>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Package className="w-4 h-4" />
                  <span>Còn lại: <strong className="text-foreground">{product.stock}</strong></span>
                </div>
                <span className="text-muted-foreground">•</span>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{product.location}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {(product.type === 'rent' || product.type === 'both') && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1 rounded-full h-12 border-2 border-secondary text-secondary-foreground hover:bg-secondary/10"
                    onClick={() => { setIsRentModalOpen(true); setRentError(null); setRentValid(false); }}
                  >
                    <Calendar className="w-4 h-4 mr-2" /> Thuê ngay
                  </Button>
                )}
                {(product.type === 'buy' || product.type === 'both') && (
                  <Button
                    size="lg"
                    className="flex-1 rounded-full h-12 shadow-lg shadow-primary/20"
                    onClick={() => setIsBuyModalOpen(true)}
                  >
                    Mua ngay
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="outline"
                  className="flex-1 rounded-full h-12"
                  onClick={handleQuickAddToCart}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" /> Thêm vào giỏ
                </Button>
              </div>
            </div>

            {/* Facility info */}
            {facility && (
              <div className="bg-white rounded-3xl border p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img src={facility.avatar} alt={facility.name} className="w-16 h-16 rounded-full object-cover border-2 border-primary/20" />
                    <div>
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        {facility.name}
                        {facility.isVerified && <ShieldCheck className="w-4 h-4 text-primary" />}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{facility.address}, {facility.ward}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <span className="font-medium text-foreground">{facility.province}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Link href="/messages">
                      <Button variant="outline" size="sm" className="rounded-full">
                        <MessageSquare className="w-4 h-4 mr-1" /> Chat ngay
                      </Button>
                    </Link>
                    <Link href={`/facility/${facility.id}`}>
                      <Button size="sm" className="rounded-full bg-primary/10 text-primary hover:bg-primary/20 border-0 shadow-none">
                        <Store className="w-4 h-4 mr-1" /> Xem cơ sở
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    <span><strong className="text-foreground">{facility.totalOrders}</strong> đơn đã hoàn thành</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Tham gia {formatDistanceToNow(new Date(facility.joinedDate), { locale: vi, addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Block */}
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
            {reviews.map(review => {
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
                        <button key={i} onClick={() => setReviewLightbox({ media: allMedia, idx: i })} className="w-20 h-20 rounded-xl overflow-hidden border hover:opacity-90 transition-opacity flex-shrink-0">
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

        {/* Recommended Products */}
        {recommended.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-display font-bold mb-6">Sản phẩm tương tự</h2>
            <RecommendSlider products={recommended} />
          </div>
        )}
      </div>

      {/* Buy Modal */}
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
                <button onClick={() => setBuyQty(q => Math.max(1, q - 1))} className="p-1 rounded-lg hover:bg-gray-100">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-bold w-8 text-center">{buyQty}</span>
                <button onClick={() => setBuyQty(q => Math.min(product.stock, q + 1))} className="p-1 rounded-lg hover:bg-gray-100">
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
            <Button variant="outline" onClick={() => setIsBuyModalOpen(false)} className="rounded-full">Hủy</Button>
            <Button onClick={() => handleCheckoutNow('buy')} className="rounded-full px-8">Mua ngay</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rent Modal */}
      <Dialog open={isRentModalOpen} onOpenChange={v => { setIsRentModalOpen(v); if (!v) { setRentError(null); setRentValid(false); } }}>
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
                  <Input type="date" value={rentStartDate} min={new Date().toISOString().split("T")[0]}
                    onChange={e => { setRentStartDate(e.target.value); setRentValid(false); setRentError(null); }}
                    className="rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Ngày kết thúc</label>
                  <Input type="date" value={rentEndDate} min={rentStartDate || new Date().toISOString().split("T")[0]}
                    onChange={e => { setRentEndDate(e.target.value); setRentValid(false); setRentError(null); }}
                    className="rounded-xl" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">Số lượng</span>
                <div className="flex items-center gap-3 border rounded-xl px-2 py-1">
                  <button onClick={() => { setRentQty(q => Math.max(1, q - 1)); setRentValid(false); setRentError(null); }} className="p-1 rounded-lg hover:bg-gray-100">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-bold w-8 text-center">{rentQty}</span>
                  <button onClick={() => { setRentQty(q => Math.min(product.stock, q + 1)); setRentValid(false); setRentError(null); }} className="p-1 rounded-lg hover:bg-gray-100">
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
                <Button onClick={handleRentCheck} disabled={!rentStartDate || !rentEndDate || rentValidating} variant="outline" className="w-full rounded-xl" size="sm">
                  {rentValidating ? "Đang kiểm tra..." : "Kiểm tra thời gian"}
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRentModalOpen(false)} className="rounded-full">Hủy</Button>
            <Button
              onClick={() => handleCheckoutNow('rent')}
              disabled={!rentValid}
              className="rounded-full px-8 bg-secondary text-secondary-foreground hover:bg-secondary/90"
            >
              Thuê ngay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {reviewLightbox && (
        <ReviewMediaLightbox
          media={reviewLightbox.media}
          startIdx={reviewLightbox.idx}
          onClose={() => setReviewLightbox(null)}
        />
      )}
    </div>
  );
}
