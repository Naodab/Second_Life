"use client"

import { useState, useMemo, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductCard } from '@/components/products/product-card'
import { mockProducts, mockFacilities, mockCategories, formatDate } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Star, 
  MapPin, 
  Package, 
  Clock, 
  MessageCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useRef } from 'react'

interface ShopPageProps {
  params: Promise<{ id: string }>
}

export default function ShopPage({ params }: ShopPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const categoryScrollRef = useRef<HTMLDivElement>(null)
  
  const facility = mockFacilities.find(f => f.id === id)
  const shopProducts = mockProducts.filter(p => p.facilityId === id)
  
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Get unique categories from shop products
  const shopCategories = useMemo(() => {
    const categoryIds = [...new Set(shopProducts.map(p => p.categoryId))]
    const categories = categoryIds.map(catId => {
      const category = mockCategories.flatMap(c => c.subcategories).find(s => s.id === catId)
      return category ? { id: catId, name: category.name } : null
    }).filter(Boolean)
    return [{ id: 'all', name: 'All Products' }, ...categories]
  }, [shopProducts])

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') return shopProducts
    return shopProducts.filter(p => p.categoryId === selectedCategory)
  }, [shopProducts, selectedCategory])

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 200
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  if (!facility) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header showSearch={false} />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold mb-4">Shop not found</h1>
          <Button onClick={() => router.push('/')} className="rounded-full">
            Back to Home
          </Button>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header showSearch={false} />
      
      <main className="flex-1">
        {/* Shop Header */}
        <div className="bg-secondary/30 border-b border-border">
          <div className="container mx-auto px-4 py-8">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Link href="/" className="hover:text-foreground">Home</Link>
              <span>/</span>
              <span className="text-foreground">{facility.name}</span>
            </nav>

            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={facility.avatar} alt={facility.name} />
                    <AvatarFallback className="text-2xl">{facility.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h1 className="text-2xl font-semibold">{facility.name}</h1>
                        <div className="flex items-center gap-1 text-muted-foreground mt-1">
                          <MapPin className="h-4 w-4" />
                          {facility.address.ward}, {facility.address.province}
                        </div>
                      </div>
                      <Button className="rounded-full" asChild>
                        <Link href={`/messages?shop=${facility.id}`}>
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Chat with Shop
                        </Link>
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-6 mt-4">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Star className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{facility.rating}</p>
                          <p className="text-xs text-muted-foreground">Rating</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{facility.totalOrders.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Orders</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{formatDate(facility.joinedAt)}</p>
                          <p className="text-xs text-muted-foreground">Joined</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Category Slider */}
        <div className="border-b border-border sticky top-16 bg-background z-40">
          <div className="container mx-auto px-4">
            <div className="relative flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-0 z-10 rounded-full h-8 w-8 bg-background/80 backdrop-blur"
                onClick={() => scrollCategories('left')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div 
                ref={categoryScrollRef}
                className="flex-1 overflow-x-auto scrollbar-hide mx-10"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-max">
                  <TabsList className="bg-transparent h-14 gap-2">
                    {shopCategories.map(cat => cat && (
                      <TabsTrigger
                        key={cat.id}
                        value={cat.id}
                        className="rounded-full px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        {cat.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 z-10 rounded-full h-8 w-8 bg-background/80 backdrop-blur"
                onClick={() => scrollCategories('right')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              {filteredProducts.length} products
            </p>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="h-24 w-24 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                <Package className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No products in this category</h3>
              <p className="text-muted-foreground mb-4">
                Check out other categories from this shop
              </p>
              <Button 
                variant="outline" 
                className="rounded-full" 
                onClick={() => setSelectedCategory('all')}
              >
                View All Products
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
