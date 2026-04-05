import { useState } from "react";
import { useRoute } from "wouter";
import { Star, MapPin, ShieldCheck, Heart, Share2, Store, Calendar, MessageSquare, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProduct, useCart } from "@/hooks/use-mock-api";
import { formatCurrency, cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const productId = params?.id || "";
  const { data: product, shop, reviews, isLoading } = useProduct(productId);
  
  const [activeImage, setActiveImage] = useState(0);
  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = (mode: 'buy' | 'rent') => {
    if (!product) return;
    addToCart(product, 1);
    toast({
      title: "Đã thêm vào giỏ hàng!",
      description: `${product.name} đã được thêm vào giỏ hàng để ${mode === 'buy' ? 'mua' : 'thuê'}.`,
    });
    setIsRentModalOpen(false);
    setIsBuyModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <Skeleton className="aspect-square rounded-3xl" />
          <div className="space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-32 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-14 w-full rounded-full" />
              <Skeleton className="h-14 w-full rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return <div className="text-center py-20 text-2xl font-bold">Không tìm thấy sản phẩm</div>;

  return (
    <div className="min-h-screen bg-gray-50/30 pb-20">
      
      {/* Breadcrumb */}
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-sm text-muted-foreground flex gap-2">
          <span>Trang chủ</span>
          <span>/</span>
          <span>{product.category}</span>
          <span>/</span>
          <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Images Section */}
          <div className="lg:col-span-5 space-y-4">
            <div className="aspect-square rounded-3xl overflow-hidden bg-white border shadow-sm relative group">
              <img 
                src={product.images[activeImage]} 
                alt={product.name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <Button variant="secondary" size="icon" className="rounded-full bg-white/80 backdrop-blur-md hover:bg-white text-foreground shadow-sm">
                  <Heart className="w-5 h-5" />
                </Button>
                <Button variant="secondary" size="icon" className="rounded-full bg-white/80 backdrop-blur-md hover:bg-white text-foreground shadow-sm">
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            {product.images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
                {product.images.map((img, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveImage(idx)}
                    className={cn(
                      "w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all",
                      activeImage === idx ? "border-primary opacity-100" : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={img} alt={`Ảnh ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="bg-white rounded-3xl border p-8 shadow-sm mb-6 flex-1">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{product.category}</Badge>
                <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">Tình trạng: {product.condition}</Badge>
              </div>
              
              <h1 className="text-3xl font-display font-bold text-foreground mb-4 leading-tight">{product.name}</h1>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b">
                <div className="flex items-center gap-1 text-amber-500 font-medium">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{product.rating}</span>
                  <span className="text-muted-foreground font-normal">({product.reviewsCount} đánh giá)</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{product.location}</span>
                </div>
                <span>•</span>
                <span>Kho: {product.stock}</span>
              </div>

              {/* Pricing Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {(product.type === 'buy' || product.type === 'both') && product.buyPrice && (
                  <div className="border rounded-2xl p-5 bg-gradient-to-br from-white to-primary/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">MUA</div>
                    <p className="text-sm text-muted-foreground mb-1">Giá bán</p>
                    <p className="text-3xl font-bold text-foreground mb-2">{formatCurrency(product.buyPrice)}</p>
                    {product.aiSuggestedBuyPrice && (
                      <div className="flex items-center gap-1 text-xs text-primary bg-primary/10 w-max px-2 py-1 rounded-md mt-2">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Giá hợp lý theo AI định giá</span>
                      </div>
                    )}
                  </div>
                )}
                
                {(product.type === 'rent' || product.type === 'both') && product.rentPrice && (
                  <div className="border rounded-2xl p-5 bg-gradient-to-br from-white to-secondary/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-secondary text-secondary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-xl">THUÊ</div>
                    <p className="text-sm text-muted-foreground mb-1">Giá thuê</p>
                    <p className="text-3xl font-bold text-secondary-foreground mb-2">
                      {formatCurrency(product.rentPrice)} <span className="text-lg font-normal text-muted-foreground">/ ngày</span>
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-gray-100 w-max px-2 py-1 rounded-md mt-2">
                      <Info className="w-3 h-3" />
                      <span>Cần đặt cọc 30%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                {(product.type === 'buy' || product.type === 'both') && (
                  <Button 
                    size="lg" 
                    className="flex-1 rounded-full h-14 text-lg shadow-lg shadow-primary/20"
                    onClick={() => setIsBuyModalOpen(true)}
                  >
                    Mua ngay
                  </Button>
                )}
                {(product.type === 'rent' || product.type === 'both') && (
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="flex-1 rounded-full h-14 text-lg border-2 border-secondary text-secondary-foreground hover:bg-secondary/10"
                    onClick={() => setIsRentModalOpen(true)}
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    Thuê ngay
                  </Button>
                )}
              </div>

              {/* Description */}
              <div>
                <h3 className="font-bold mb-2">Mô tả sản phẩm</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            </div>

            {/* Shop Info Card */}
            {shop && (
              <div className="bg-white rounded-3xl border p-6 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img src={shop.avatar} alt={shop.name} className="w-16 h-16 rounded-full object-cover border" />
                  <div>
                    <h3 className="font-bold flex items-center gap-2">
                      {shop.name}
                      {shop.isVerified && <ShieldCheck className="w-4 h-4 text-primary" />}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-current text-amber-500" /> {shop.rating}</span>
                      <span>•</span>
                      <span>{shop.totalOrders} đơn hàng</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-full hidden sm:flex">
                    <MessageSquare className="w-4 h-4 mr-2" /> Nhắn tin
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-full bg-primary/10 text-primary hover:bg-primary/20">
                    <Store className="w-4 h-4 mr-2" /> Xem cửa hàng
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs for Reviews */}
        <div className="mt-12 bg-white rounded-3xl border p-8 shadow-sm">
          <Tabs defaultValue="reviews">
            <TabsList className="bg-transparent border-b w-full justify-start rounded-none h-auto p-0 space-x-8 mb-8">
              <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 text-base">
                Đánh giá ({product.reviewsCount})
              </TabsTrigger>
              <TabsTrigger value="policies" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 text-base">
                Chính sách cửa hàng
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="reviews" className="space-y-6">
              {reviews.map(review => (
                <div key={review.id} className="pb-6 border-b last:border-0 last:pb-0">
                  <div className="flex items-center gap-3 mb-3">
                    <img src={review.userAvatar} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <h4 className="font-semibold text-sm">{review.userName}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex text-amber-500">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={cn("w-3 h-3", i < review.rating ? "fill-current" : "text-gray-300")} />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{review.date}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm ml-13">{review.comment}</p>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="policies" className="text-muted-foreground">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-secondary flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-foreground mb-1">Đặt cọc khi thuê</h4>
                    <p className="text-sm">Tất cả giao dịch thuê yêu cầu đặt cọc 30% tổng giá trị sản phẩm. Khoản này được giữ an toàn và hoàn trả đầy đủ khi trả hàng đúng tình trạng ban đầu.</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-foreground mb-1">Bảo vệ người mua</h4>
                    <p className="text-sm">Nếu sản phẩm không đúng mô tả, bạn có 3 ngày kể từ khi nhận hàng để yêu cầu hoàn trả và hoàn tiền đầy đủ qua nền tảng Second Life.</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modals */}
      <Dialog open={isBuyModalOpen} onOpenChange={setIsBuyModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Thêm vào giỏ hàng (Mua)</DialogTitle>
          </DialogHeader>
          <div className="py-6 flex items-center gap-4 border-y my-4">
            <img src={product.images[0]} className="w-20 h-20 rounded-xl object-cover" />
            <div>
              <h4 className="font-bold line-clamp-1">{product.name}</h4>
              <p className="text-primary font-bold text-xl mt-1">{formatCurrency(product.buyPrice || 0)}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBuyModalOpen(false)} className="rounded-full">Hủy</Button>
            <Button onClick={() => handleAddToCart('buy')} className="rounded-full px-8">Xác nhận thêm vào giỏ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRentModalOpen} onOpenChange={setIsRentModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Chọn ngày thuê</DialogTitle>
          </DialogHeader>
          <div className="py-6 border-y my-4">
            <div className="flex items-center gap-4 mb-6">
              <img src={product.images[0]} className="w-16 h-16 rounded-xl object-cover" />
              <div>
                <h4 className="font-bold line-clamp-1">{product.name}</h4>
                <p className="text-secondary-foreground font-bold">{formatCurrency(product.rentPrice || 0)} <span className="text-xs font-normal">/ ngày</span></p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 text-center border border-dashed border-gray-300">
              <p className="text-sm text-muted-foreground mb-2">Chọn ngày thuê</p>
              <div className="flex justify-center gap-4">
                <div className="bg-white px-4 py-2 rounded-lg border font-medium">Ngày mai</div>
                <div className="flex items-center text-muted-foreground">đến</div>
                <div className="bg-white px-4 py-2 rounded-lg border font-medium text-primary border-primary/50">Tuần tới</div>
              </div>
              <p className="text-xs text-primary mt-4 font-medium">Đã chọn 7 ngày • Tổng: {formatCurrency((product.rentPrice || 0) * 7)}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRentModalOpen(false)} className="rounded-full">Hủy</Button>
            <Button onClick={() => handleAddToCart('rent')} className="rounded-full px-8 bg-secondary text-secondary-foreground hover:bg-secondary/90">Thêm vào giỏ để thuê</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
