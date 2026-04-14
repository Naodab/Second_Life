"use client"

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useCart } from '@/contexts/cart-context'
import { mockProducts } from '@/lib/mock-data'
import { ProductCard, ProductCardSkeleton } from '@/components/products/product-card'
import { Button } from '@/components/ui/button'
import { MapPin, LogIn } from 'lucide-react'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { BuyModal } from '@/components/products/buy-modal'
import { RentModal } from '@/components/products/rent-modal'
import type { Product } from '@/lib/types'

const ITEMS_PER_PAGE = 12

export function RecommendedSection() {
  const { isLoggedIn, user } = useAuth()
  const { addItem } = useCart()
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [buyModalOpen, setBuyModalOpen] = useState(false)
  const [rentModalOpen, setRentModalOpen] = useState(false)

  const totalPages = Math.ceil(mockProducts.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const visibleProducts = isLoggedIn 
    ? mockProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE)
    : mockProducts.slice(0, 8)

  const handlePageChange = (page: number) => {
    setIsLoading(true)
    setCurrentPage(page)
    setTimeout(() => setIsLoading(false), 300)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBuyNow = (product: Product) => {
    setSelectedProduct(product)
    setBuyModalOpen(true)
  }

  const handleRentNow = (product: Product) => {
    setSelectedProduct(product)
    setRentModalOpen(true)
  }

  const handleBuyConfirm = (quantity: number) => {
    if (selectedProduct) {
      addItem(selectedProduct, 'buy', quantity)
      setBuyModalOpen(false)
    }
  }

  const handleRentConfirm = (dateRange: { start: string; end: string }) => {
    if (selectedProduct) {
      addItem(selectedProduct, 'rent', 1, dateRange)
      setRentModalOpen(false)
    }
  }

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold">De xuat cho ban</h2>
            {user?.location && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                Dua tren vi tri: {user.location.ward}, {user.location.province}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {isLoading
            ? Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))
            : visibleProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product}
                  onBuyNow={() => handleBuyNow(product)}
                  onRentNow={() => handleRentNow(product)}
                />
              ))
          }
        </div>

        {!isLoggedIn && (
          <div className="mt-8 p-6 rounded-2xl bg-secondary/50 text-center">
            <LogIn className="h-10 w-10 mx-auto text-primary mb-3" />
            <h3 className="font-semibold text-lg mb-2">Dang nhap de xem them</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Dang nhap de nhan de xuat ca nhan hoa dua tren vi tri va so thich cua ban.
            </p>
            <Button className="rounded-full">
              Dang nhap
            </Button>
          </div>
        )}

        {isLoggedIn && totalPages > 1 && (
          <Pagination className="mt-8">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage > 1) handlePageChange(currentPage - 1)
                  }}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const page = i + 1
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        handlePageChange(page)
                      }}
                      isActive={currentPage === page}
                      className="rounded-full"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}
              <PaginationItem>
                <PaginationNext 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage < totalPages) handlePageChange(currentPage + 1)
                  }}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      {selectedProduct && (
        <>
          <BuyModal
            open={buyModalOpen}
            onOpenChange={setBuyModalOpen}
            product={selectedProduct}
            onConfirm={handleBuyConfirm}
          />
          <RentModal
            open={rentModalOpen}
            onOpenChange={setRentModalOpen}
            product={selectedProduct}
            onConfirm={handleRentConfirm}
          />
        </>
      )}
    </section>
  )
}
