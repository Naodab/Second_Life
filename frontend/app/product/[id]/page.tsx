"use client"

import { useState, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductCard } from '@/components/products/product-card'
import { BuyModal } from '@/components/products/buy-modal'
import { RentModal } from '@/components/products/rent-modal'
import { useCart } from '@/contexts/cart-context'
import { mockProducts, mockFacilities, mockReviews, formatPrice, formatDate } from '@/lib/mock-data'
import type { Product } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Star, 
  ShoppingCart, 
  Calendar, 
  MessageCircle, 
  Store, 
  MapPin, 
  Package, 
  Clock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Heart
} from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface ProductPageProps {
  params: Promise<{ id: string }>
}

export default function ProductPage({ params }: ProductPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { addItem } = useCart()
  
  const product = mockProducts.find(p => p.id === id)
  const facility = product ? mockFacilities.find(f => f.id === product.facilityId) : null
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [buyModalOpen, setBuyModalOpen] = useState(false)
  const [rentModalOpen, setRentModalOpen] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  if (!product || !facility) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header showSearch={false} />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold mb-4">Product not found</h1>
          <Button onClick={() => router.push('/')} className="rounded-full">
            Back to Home
          </Button>
        </main>
        <Footer />
      </div>
    )
  }

  const images = product.images.length > 0 ? product.images : [product.mainImageUrl]
  
  // Get recommended products (same category, excluding current)
  const recommendedProducts = mockProducts
    .filter(p => p.id !== product.id)
    .slice(0, 8)

  const handleBuyConfirm = (quantity: number) => {
    addItem(product, 'buy', quantity)
    setBuyModalOpen(false)
  }

  const handleRentConfirm = (dateRange: { start: string; end: string }) => {
    addItem(product, 'rent', 1, dateRange)
    setRentModalOpen(false)
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header showSearch={false} />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link href="/search" className="hover:text-foreground">Search</Link>
            <span>/</span>
            <span className="text-foreground line-clamp-1">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div 
                className="relative aspect-square rounded-2xl overflow-hidden bg-secondary cursor-pointer"
                onClick={() => setLightboxOpen(true)}
              >
                <Image
                  src={images[currentImageIndex]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
                {images.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 bg-background/80 backdrop-blur"
                      onClick={(e) => { e.stopPropagation(); prevImage() }}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 bg-background/80 backdrop-blur"
                      onClick={(e) => { e.stopPropagation(); nextImage() }}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </>
                )}
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-3 right-3 rounded-full h-10 w-10 bg-background/80 backdrop-blur"
                  onClick={(e) => { e.stopPropagation(); setIsFavorite(!isFavorite) }}
                >
                  <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
              </div>
              
              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      className={`relative h-20 w-20 rounded-xl overflow-hidden shrink-0 border-2 transition-colors ${
                        currentImageIndex === index ? 'border-primary' : 'border-transparent'
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    >
                      <Image src={img} alt="" fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-2xl md:text-3xl font-semibold text-balance">{product.name}</h1>
                  <Badge className="shrink-0">
                    {product.listingType === 'both' ? 'Buy & Rent' : product.listingType === 'buy' ? 'Buy Only' : 'Rent Only'}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <span className="font-medium">{product.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-muted-foreground">({product.reviewCount} reviews)</span>
                  <span className="text-muted-foreground">|</span>
                  <span className="text-muted-foreground">{product.stock} in stock</span>
                </div>
              </div>

              <p className="text-muted-foreground leading-relaxed">{product.description}</p>

              {/* Details */}
              {(product.color || product.material) && (
                <div className="flex flex-wrap gap-4 text-sm">
                  {product.color && (
                    <div>
                      <span className="text-muted-foreground">Color: </span>
                      <span className="font-medium">{product.color}</span>
                    </div>
                  )}
                  {product.material && (
                    <div>
                      <span className="text-muted-foreground">Material: </span>
                      <span className="font-medium">{product.material}</span>
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {/* Pricing */}
              <div className="space-y-4">
                {product.buyPrice && (
                  <div className="p-4 rounded-xl bg-secondary/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Buy Price</p>
                        <p className="text-2xl font-bold text-primary">{formatPrice(product.buyPrice)}</p>
                      </div>
                      {product.aiSuggestedBuyPrice && (
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <Sparkles className="h-3 w-3" />
                            AI Suggested
                          </div>
                          <p className="text-sm font-medium">{formatPrice(product.aiSuggestedBuyPrice)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {product.rentPrice && (
                  <div className="p-4 rounded-xl bg-accent/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Rent Price</p>
                        <p className="text-2xl font-bold">{formatPrice(product.rentPrice)}<span className="text-sm font-normal text-muted-foreground">/day</span></p>
                      </div>
                      {product.aiSuggestedRentPrice && (
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <Sparkles className="h-3 w-3" />
                            AI Suggested
                          </div>
                          <p className="text-sm font-medium">{formatPrice(product.aiSuggestedRentPrice)}/day</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {(product.listingType === 'buy' || product.listingType === 'both') && (
                  <Button 
                    className="flex-1 rounded-full h-12 text-base"
                    onClick={() => setBuyModalOpen(true)}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Buy Now
                  </Button>
                )}
                {(product.listingType === 'rent' || product.listingType === 'both') && (
                  <Button 
                    variant="secondary"
                    className="flex-1 rounded-full h-12 text-base"
                    onClick={() => setRentModalOpen(true)}
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Rent Now
                  </Button>
                )}
              </div>

              <Separator />

              {/* Shop Info */}
              <Card className="rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={facility.avatar} alt={facility.name} />
                      <AvatarFallback>{facility.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold">{facility.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {facility.address.ward}, {facility.address.province}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Package className="h-3.5 w-3.5" />
                          {facility.totalOrders.toLocaleString()} orders
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Joined {formatDate(facility.joinedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                          {facility.rating}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" className="flex-1 rounded-full" asChild>
                      <Link href={`/messages?shop=${facility.id}`}>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Chat
                      </Link>
                    </Button>
                    <Button variant="outline" className="flex-1 rounded-full" asChild>
                      <Link href={`/shop/${facility.id}`}>
                        <Store className="h-4 w-4 mr-2" />
                        View Shop
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Reviews Section */}
          <section className="mt-12">
            <h2 className="text-xl font-semibold mb-6">Customer Reviews</h2>
            
            <div className="flex items-center gap-6 mb-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">{product.rating.toFixed(1)}</div>
                <div className="flex items-center gap-0.5 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'fill-primary text-primary' : 'text-muted'}`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{product.reviewCount} reviews</p>
              </div>
            </div>

            <div className="space-y-4">
              {mockReviews.map(review => (
                <Card key={review.id} className="rounded-2xl">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={review.userAvatar} alt={review.userName} />
                        <AvatarFallback>{review.userName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{review.userName}</h4>
                          <span className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-0.5 mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-primary text-primary' : 'text-muted'}`}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                        {review.images && review.images.length > 0 && (
                          <div className="flex gap-2 mt-3">
                            {review.images.map((img, index) => (
                              <div key={index} className="relative h-16 w-16 rounded-lg overflow-hidden">
                                <Image src={img} alt="" fill className="object-cover" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Recommended Products */}
          <section className="mt-12">
            <h2 className="text-xl font-semibold mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {recommendedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black/90 border-0">
          <div className="relative aspect-[4/3]">
            <Image
              src={images[currentImageIndex]}
              alt={product.name}
              fill
              className="object-contain"
            />
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full h-12 w-12 text-white hover:bg-white/20"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-12 w-12 text-white hover:bg-white/20"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      <BuyModal
        open={buyModalOpen}
        onOpenChange={setBuyModalOpen}
        product={product}
        onConfirm={handleBuyConfirm}
      />
      <RentModal
        open={rentModalOpen}
        onOpenChange={setRentModalOpen}
        product={product}
        onConfirm={handleRentConfirm}
      />
    </div>
  )
}
