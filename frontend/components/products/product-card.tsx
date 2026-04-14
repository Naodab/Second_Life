"use client"

import Image from 'next/image'
import Link from 'next/link'
import type { Product } from '@/lib/types'
import { formatPrice } from '@/lib/mock-data'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Star, ShoppingCart, Calendar } from 'lucide-react'

interface ProductCardProps {
  product: Product
  onBuyNow?: () => void
  onRentNow?: () => void
}

export function ProductCard({ product, onBuyNow, onRentNow }: ProductCardProps) {
  const { 
    id, 
    name, 
    mainImageUrl, 
    buyPrice, 
    rentPrice, 
    listingType, 
    rating, 
    reviewCount 
  } = product

  return (
    <Card className="group overflow-hidden rounded-2xl border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
      <Link href={`/product/${id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-secondary">
          <Image
            src={mainImageUrl}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
          <div className="absolute top-2 left-2 flex gap-1">
            {listingType === 'buy' && (
              <Badge variant="secondary" className="bg-background/90 backdrop-blur text-xs">
                Chi ban
              </Badge>
            )}
            {listingType === 'rent' && (
              <Badge variant="secondary" className="bg-background/90 backdrop-blur text-xs">
                Chi thue
              </Badge>
            )}
            {listingType === 'both' && (
              <Badge className="bg-primary/90 backdrop-blur text-xs text-primary-foreground">
                Mua & Thue
              </Badge>
            )}
          </div>
        </div>
      </Link>
      
      <CardContent className="p-3 flex flex-col flex-1">
        <Link href={`/product/${id}`} className="flex-1">
          <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem]">
            {name}
          </h3>
        </Link>

        <div className="flex items-center gap-1 mt-2">
          <Star className="h-3 w-3 fill-primary text-primary" />
          <span className="text-xs font-medium">{rating.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">({reviewCount})</span>
        </div>

        <div className="mt-2 space-y-1">
          {buyPrice && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Mua:</span>
              <span className="font-semibold text-sm text-primary">{formatPrice(buyPrice)}</span>
            </div>
          )}
          {rentPrice && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Thue/ngay:</span>
              <span className="font-medium text-sm">{formatPrice(rentPrice)}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 mt-3">
          {(listingType === 'buy' || listingType === 'both') && (
            <Button 
              size="sm" 
              className="w-full rounded-full text-xs h-8"
              onClick={(e) => {
                e.preventDefault()
                onBuyNow?.()
              }}
            >
              <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
              Mua ngay
            </Button>
          )}
          {(listingType === 'rent' || listingType === 'both') && (
            <Button 
              size="sm" 
              variant="outline"
              className="w-full rounded-full text-xs h-8"
              onClick={(e) => {
                e.preventDefault()
                onRentNow?.()
              }}
            >
              <Calendar className="h-3.5 w-3.5 mr-1.5" />
              Thue ngay
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-2xl h-full flex flex-col">
      <div className="aspect-square bg-secondary animate-pulse" />
      <CardContent className="p-3 flex flex-col flex-1">
        <div className="h-10 bg-secondary rounded animate-pulse" />
        <div className="h-3 bg-secondary rounded w-1/2 animate-pulse mt-2" />
        <div className="space-y-1 mt-2">
          <div className="h-4 bg-secondary rounded animate-pulse" />
          <div className="h-4 bg-secondary rounded animate-pulse" />
        </div>
        <div className="flex flex-col gap-2 mt-3">
          <div className="h-8 bg-secondary rounded-full animate-pulse" />
          <div className="h-8 bg-secondary rounded-full animate-pulse" />
        </div>
      </CardContent>
    </Card>
  )
}
