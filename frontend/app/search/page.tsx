"use client"

import { useState, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductCard, ProductCardSkeleton } from '@/components/products/product-card'
import { BuyModal } from '@/components/products/buy-modal'
import { RentModal } from '@/components/products/rent-modal'
import { useCart } from '@/contexts/cart-context'
import { mockProducts, mockCategories, vietnamProvinces, vietnamWards } from '@/lib/mock-data'
import type { Product, ListingType } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { SlidersHorizontal, X } from 'lucide-react'

const ITEMS_PER_PAGE = 24

function SearchContent() {
  const searchParams = useSearchParams()
  const { addItem } = useCart()
  
  const initialQuery = searchParams.get('q') || ''
  const initialType = searchParams.get('type') as ListingType | 'all' || 'all'
  const initialCategory = searchParams.get('category') || ''

  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [activeTab, setActiveTab] = useState(initialType)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedProvince, setSelectedProvince] = useState('')
  const [selectedWard, setSelectedWard] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [sortBy, setSortBy] = useState('relevance')
  const [filtersOpen, setFiltersOpen] = useState(false)
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [buyModalOpen, setBuyModalOpen] = useState(false)
  const [rentModalOpen, setRentModalOpen] = useState(false)

  // Get all subcategories for filter
  const allSubcategories = useMemo(() => 
    mockCategories.flatMap(cat => 
      cat.subcategories.map(sub => ({
        ...sub,
        parentName: cat.name
      }))
    ), []
  )

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let products = [...mockProducts]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      products = products.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query)
      )
    }

    // Filter by listing type
    if (activeTab !== 'all') {
      products = products.filter(p => {
        if (activeTab === 'buy') return p.listingType === 'buy' || p.listingType === 'both'
        if (activeTab === 'rent') return p.listingType === 'rent' || p.listingType === 'both'
        if (activeTab === 'both') return p.listingType === 'both'
        return true
      })
    }

    // Filter by category
    if (selectedCategory) {
      products = products.filter(p => p.categoryId === selectedCategory)
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        products.sort((a, b) => (a.buyPrice || a.rentPrice || 0) - (b.buyPrice || b.rentPrice || 0))
        break
      case 'price-high':
        products.sort((a, b) => (b.buyPrice || b.rentPrice || 0) - (a.buyPrice || a.rentPrice || 0))
        break
      case 'rating':
        products.sort((a, b) => b.rating - a.rating)
        break
      case 'newest':
        products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
    }

    return products
  }, [searchQuery, activeTab, selectedCategory, sortBy])

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as ListingType | 'all')
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSelectedProvince('')
    setSelectedWard('')
    setSelectedCategory('')
    setSortBy('relevance')
  }

  const hasActiveFilters = selectedProvince || selectedWard || selectedCategory || sortBy !== 'relevance'

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

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Location */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Location</Label>
        <Select value={selectedProvince} onValueChange={(v) => { setSelectedProvince(v); setSelectedWard('') }}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Select Province" />
          </SelectTrigger>
          <SelectContent>
            {vietnamProvinces.map(province => (
              <SelectItem key={province} value={province}>{province}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedProvince && vietnamWards[selectedProvince] && (
          <Select value={selectedWard} onValueChange={setSelectedWard}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Select Ward/District" />
            </SelectTrigger>
            <SelectContent>
              {vietnamWards[selectedProvince].map(ward => (
                <SelectItem key={ward} value={ward}>{ward}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <Separator />

      {/* Sort */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Sort By</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Relevance</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="newest">Newest First</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Categories */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Category</Label>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {allSubcategories.map(sub => (
            <div key={sub.id} className="flex items-center gap-2">
              <Checkbox 
                id={sub.id}
                checked={selectedCategory === sub.id}
                onCheckedChange={(checked) => setSelectedCategory(checked ? sub.id : '')}
              />
              <label htmlFor={sub.id} className="text-sm cursor-pointer">
                {sub.name}
              </label>
            </div>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <>
          <Separator />
          <Button variant="outline" className="w-full rounded-xl" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </>
      )}
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header 
        onSearchChange={handleSearch}
        onTabChange={handleTabChange}
        activeTab={activeTab}
      />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 p-4 rounded-2xl bg-card border border-border">
              <h2 className="font-semibold mb-4">Filters</h2>
              <FilterContent />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Mobile Filter Button & Results Count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {filteredProducts.length} results
                {searchQuery && <span> for &ldquo;{searchQuery}&rdquo;</span>}
              </p>
              
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden rounded-full">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Filters
                    {hasActiveFilters && (
                      <span className="ml-1 h-2 w-2 rounded-full bg-primary" />
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Product Grid */}
            {paginatedProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                  {paginatedProducts.map(product => (
                    <ProductCard 
                      key={product.id} 
                      product={product}
                      onBuyNow={() => handleBuyNow(product)}
                      onRentNow={() => handleRentNow(product)}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <Pagination className="mt-8">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault()
                            if (currentPage > 1) setCurrentPage(currentPage - 1)
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
                                setCurrentPage(page)
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
                            if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                          }}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <div className="h-24 w-24 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                  <SlidersHorizontal className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or search terms
                </p>
                <Button variant="outline" className="rounded-full" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

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
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
