"use client"

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useCart } from '@/contexts/cart-context'
import { useAuth } from '@/contexts/auth-context'
import { formatPrice } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { 
  CheckCircle, 
  CreditCard, 
  ShieldCheck,
  ArrowLeft,
  Package
} from 'lucide-react'
import { differenceInDays, format } from 'date-fns'

export default function CheckoutPage() {
  const router = useRouter()
  const { isLoggedIn, user } = useAuth()
  const { items, selectedItems, clearCart } = useCart()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Get selected items
  const checkoutItems = useMemo(() => 
    items.filter(item => selectedItems.includes(item.id)),
    [items, selectedItems]
  )

  // Calculate totals
  const { subtotal } = useMemo(() => {
    let subtotal = 0
    
    checkoutItems.forEach(item => {
      if (item.type === 'buy' && item.product.buyPrice) {
        subtotal += item.product.buyPrice * item.quantity
      } else if (item.type === 'rent' && item.product.rentPrice && item.rentDateRange) {
        const days = differenceInDays(
          new Date(item.rentDateRange.end),
          new Date(item.rentDateRange.start)
        ) + 1
        subtotal += item.product.rentPrice * days
      }
    })
    
    return { subtotal }
  }, [checkoutItems])

  const deposit = subtotal * 0.3

  const handlePayment = async () => {
    setIsProcessing(true)
    
    // Simulate PayOS redirect and payment
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsProcessing(false)
    setIsSuccess(true)
    
    // Clear cart after successful payment
    setTimeout(() => {
      clearCart()
    }, 1000)
  }

  const handleSuccessClose = () => {
    router.push('/')
  }

  if (!isLoggedIn) {
    router.push('/cart')
    return null
  }

  if (checkoutItems.length === 0) {
    router.push('/cart')
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header showSearch={false} />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <Button 
          variant="ghost" 
          className="mb-6 rounded-full" 
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cart
        </Button>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Order Items */}
          <div className="flex-1 space-y-6">
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <h2 className="font-semibold text-lg mb-4">Order Items ({checkoutItems.length})</h2>
                
                <div className="space-y-4">
                  {checkoutItems.map(item => (
                    <div key={item.id} className="flex gap-4">
                      <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-secondary shrink-0">
                        <Image
                          src={item.product.mainImageUrl}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium line-clamp-1">{item.product.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {item.type === 'buy' ? 'Buy' : 'Rent'}
                          </Badge>
                          {item.type === 'buy' ? (
                            <span className="text-sm text-muted-foreground">
                              Qty: {item.quantity}
                            </span>
                          ) : item.rentDateRange && (
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(item.rentDateRange.start), 'MMM d')} - {format(new Date(item.rentDateRange.end), 'MMM d')}
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-primary mt-1">
                          {item.type === 'buy' 
                            ? formatPrice((item.product.buyPrice || 0) * item.quantity)
                            : item.rentDateRange && formatPrice(
                                (item.product.rentPrice || 0) * 
                                (differenceInDays(new Date(item.rentDateRange.end), new Date(item.rentDateRange.start)) + 1)
                              )
                          }
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <h2 className="font-semibold text-lg mb-4">Shipping Address</h2>
                <div className="p-4 rounded-xl bg-secondary/50">
                  <p className="font-medium">{user?.fullName}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {user?.location?.ward}, {user?.location?.province}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Deposit Policy */}
            <Card className="rounded-2xl border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-6 w-6 text-primary shrink-0" />
                  <div>
                    <h3 className="font-semibold">30% Deposit Policy</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      You will pay a 30% deposit now ({formatPrice(deposit)}). 
                      The remaining balance ({formatPrice(subtotal - deposit)}) is due upon delivery.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Summary */}
          <div className="lg:w-96 shrink-0">
            <Card className="rounded-2xl sticky top-24">
              <CardContent className="p-6 space-y-4">
                <h2 className="font-semibold text-lg">Payment Summary</h2>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-primary">Free</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Total</span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>

                <div className="p-3 rounded-xl bg-secondary/50">
                  <div className="flex justify-between font-semibold">
                    <span>Due Now (30% Deposit)</span>
                    <span className="text-primary text-lg">{formatPrice(deposit)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Remaining: {formatPrice(subtotal - deposit)} due upon delivery
                  </p>
                </div>

                <Button 
                  className="w-full rounded-full h-12"
                  onClick={handlePayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Spinner className="h-4 w-4 mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay {formatPrice(deposit)}
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Secure payment powered by PayOS
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />

      {/* Success Modal */}
      <Dialog open={isSuccess} onOpenChange={handleSuccessClose}>
        <DialogContent className="sm:max-w-md rounded-2xl text-center">
          <div className="py-6">
            <div className="h-20 w-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Payment Successful!</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for your order. You will receive a confirmation email shortly.
            </p>
            <div className="flex flex-col gap-2">
              <Button className="rounded-full" onClick={handleSuccessClose}>
                Continue Shopping
              </Button>
              <Button variant="outline" className="rounded-full" asChild>
                <Link href="/orders">
                  <Package className="h-4 w-4 mr-2" />
                  View My Orders
                </Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
