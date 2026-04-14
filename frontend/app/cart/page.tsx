"use client"

import { useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useCart } from '@/contexts/cart-context'
import { useAuth } from '@/contexts/auth-context'
import { formatPrice, formatDate } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  ShoppingCart, 
  Trash2, 
  Minus, 
  Plus, 
  CalendarIcon,
  ShoppingBag,
  ArrowRight
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import type { DateRange } from 'react-day-picker'

export default function CartPage() {
  const router = useRouter()
  const { isLoggedIn } = useAuth()
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    updateRentDates,
    selectedItems,
    toggleItemSelection,
    selectAll,
    deselectAll
  } = useCart()

  // Group items by date added
  const groupedItems = useMemo(() => {
    const groups: Record<string, typeof items> = {}
    items.forEach(item => {
      const date = item.addedAt
      if (!groups[date]) groups[date] = []
      groups[date].push(item)
    })
    return Object.entries(groups).sort((a, b) => 
      new Date(b[0]).getTime() - new Date(a[0]).getTime()
    )
  }, [items])

  // Calculate totals for selected items
  const { subtotal, totalItems: selectedCount } = useMemo(() => {
    let subtotal = 0
    let count = 0
    
    items.forEach(item => {
      if (selectedItems.includes(item.id)) {
        count++
        if (item.type === 'buy' && item.product.buyPrice) {
          subtotal += item.product.buyPrice * item.quantity
        } else if (item.type === 'rent' && item.product.rentPrice && item.rentDateRange) {
          const days = differenceInDays(
            new Date(item.rentDateRange.end),
            new Date(item.rentDateRange.start)
          ) + 1
          subtotal += item.product.rentPrice * days
        }
      }
    })
    
    return { subtotal, totalItems: count }
  }, [items, selectedItems])

  const deposit = subtotal * 0.3

  const allSelected = items.length > 0 && selectedItems.length === items.length

  const handleCheckout = () => {
    if (!isLoggedIn) {
      // Would trigger auth modal
      return
    }
    router.push('/checkout')
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header showSearch={false} />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <div className="h-24 w-24 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
            <ShoppingCart className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">
            Browse our collection and find something you love!
          </p>
          <Button className="rounded-full" asChild>
            <Link href="/search">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Start Shopping
            </Link>
          </Button>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header showSearch={false} />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold mb-6">Shopping Cart ({items.length} items)</h1>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Cart Items */}
          <div className="flex-1 space-y-6">
            {/* Select All */}
            <Card className="rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Checkbox 
                    checked={allSelected}
                    onCheckedChange={(checked) => checked ? selectAll() : deselectAll()}
                  />
                  <span className="font-medium">Select All ({items.length} items)</span>
                </div>
              </CardContent>
            </Card>

            {/* Grouped Items */}
            {groupedItems.map(([date, dateItems]) => (
              <div key={date}>
                <p className="text-sm text-muted-foreground mb-3">
                  Added on {formatDate(date)}
                </p>
                <div className="space-y-3">
                  {dateItems.map(item => (
                    <Card key={item.id} className="rounded-2xl">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <Checkbox 
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={() => toggleItemSelection(item.id)}
                          />
                          
                          <Link href={`/product/${item.product.id}`} className="shrink-0">
                            <div className="relative h-24 w-24 rounded-xl overflow-hidden bg-secondary">
                              <Image
                                src={item.product.mainImageUrl}
                                alt={item.product.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          </Link>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <Link 
                                  href={`/product/${item.product.id}`}
                                  className="font-medium line-clamp-1 hover:text-primary"
                                >
                                  {item.product.name}
                                </Link>
                                <Badge variant="secondary" className="mt-1">
                                  {item.type === 'buy' ? 'Buy' : 'Rent'}
                                </Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => removeItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            {item.type === 'buy' ? (
                              <div className="flex items-center justify-between mt-3">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-full"
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    disabled={item.quantity <= 1}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <Input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                                    className="w-16 h-8 text-center rounded-lg"
                                    min={1}
                                    max={item.product.stock}
                                  />
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-full"
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    disabled={item.quantity >= item.product.stock}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                                <p className="font-semibold text-primary">
                                  {formatPrice((item.product.buyPrice || 0) * item.quantity)}
                                </p>
                              </div>
                            ) : (
                              <div className="mt-3 space-y-2">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className="w-full justify-start text-left font-normal rounded-xl h-9 text-sm"
                                    >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {item.rentDateRange ? (
                                        <>
                                          {format(new Date(item.rentDateRange.start), 'MMM d')} - {format(new Date(item.rentDateRange.end), 'MMM d, yyyy')}
                                        </>
                                      ) : (
                                        <span className="text-muted-foreground">Select dates</span>
                                      )}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                                    <Calendar
                                      mode="range"
                                      selected={item.rentDateRange ? {
                                        from: new Date(item.rentDateRange.start),
                                        to: new Date(item.rentDateRange.end)
                                      } : undefined}
                                      onSelect={(range: DateRange | undefined) => {
                                        if (range?.from && range?.to) {
                                          updateRentDates(item.id, {
                                            start: format(range.from, 'yyyy-MM-dd'),
                                            end: format(range.to, 'yyyy-MM-dd')
                                          })
                                        }
                                      }}
                                      numberOfMonths={2}
                                      disabled={(date) => date < new Date()}
                                    />
                                  </PopoverContent>
                                </Popover>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">
                                    {item.rentDateRange && (
                                      <>
                                        {differenceInDays(
                                          new Date(item.rentDateRange.end),
                                          new Date(item.rentDateRange.start)
                                        ) + 1} days x {formatPrice(item.product.rentPrice || 0)}
                                      </>
                                    )}
                                  </span>
                                  <p className="font-semibold text-primary">
                                    {item.rentDateRange && formatPrice(
                                      (item.product.rentPrice || 0) * 
                                      (differenceInDays(
                                        new Date(item.rentDateRange.end),
                                        new Date(item.rentDateRange.start)
                                      ) + 1)
                                    )}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Checkout Summary */}
          <div className="lg:w-80 shrink-0">
            <Card className="rounded-2xl sticky top-24">
              <CardContent className="p-6 space-y-4">
                <h2 className="font-semibold text-lg">Order Summary</h2>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Selected Items</span>
                    <span>{selectedCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deposit (30%)</span>
                    <span>{formatPrice(deposit)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-primary text-lg">{formatPrice(subtotal)}</span>
                </div>

                <p className="text-xs text-muted-foreground">
                  * A 30% deposit is required for all orders. Remaining balance due upon delivery.
                </p>

                <Button 
                  className="w-full rounded-full h-12"
                  disabled={selectedCount === 0}
                  onClick={handleCheckout}
                >
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
