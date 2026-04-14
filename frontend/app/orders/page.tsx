"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { AuthModal } from "@/components/auth/auth-modal"
import { mockOrders, mockRentals } from "@/lib/mock-data"
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  Truck,
  Calendar,
  MessageSquare,
  ArrowRight,
  ShoppingBag
} from "lucide-react"

const statusConfig = {
  pending: { label: "Pending", icon: Clock, color: "bg-amber-100 text-amber-700" },
  confirmed: { label: "Confirmed", icon: CheckCircle2, color: "bg-blue-100 text-blue-700" },
  shipped: { label: "Shipped", icon: Truck, color: "bg-primary/20 text-primary" },
  delivered: { label: "Delivered", icon: CheckCircle2, color: "bg-green-100 text-green-700" },
  active: { label: "Active Rental", icon: Calendar, color: "bg-primary/20 text-primary" },
  returned: { label: "Returned", icon: CheckCircle2, color: "bg-green-100 text-green-700" },
}

export default function OrdersPage() {
  const { user } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
              <Package className="w-12 h-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Sign in to view your orders</h1>
            <p className="text-muted-foreground mb-6">
              Track your purchases and rentals all in one place
            </p>
            <Button onClick={() => setShowAuthModal(true)} size="lg" className="rounded-full">
              Sign In
            </Button>
          </div>
        </main>
        <Footer />
        <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>

        <Tabs defaultValue="purchases" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="purchases" className="rounded-full">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Purchases
            </TabsTrigger>
            <TabsTrigger value="rentals" className="rounded-full">
              <Calendar className="w-4 h-4 mr-2" />
              Rentals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="purchases" className="space-y-4">
            {mockOrders.length === 0 ? (
              <Card className="rounded-2xl">
                <CardContent className="flex flex-col items-center py-12">
                  <Package className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No purchases yet</h3>
                  <p className="text-muted-foreground mb-4">Start shopping to see your orders here</p>
                  <Link href="/search">
                    <Button className="rounded-full">Browse Products</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              mockOrders.map((order) => {
                const status = statusConfig[order.status as keyof typeof statusConfig]
                const StatusIcon = status.icon
                return (
                  <Card key={order.id} className="rounded-2xl overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        <div className="relative w-full md:w-48 h-48 md:h-auto">
                          <Image
                            src={order.product.images[0]}
                            alt={order.product.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 p-6">
                          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">
                                Order #{order.id} - {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                              <h3 className="text-lg font-semibold">{order.product.title}</h3>
                              <Link 
                                href={`/shop/${order.seller.id}`}
                                className="text-sm text-primary hover:underline"
                              >
                                Sold by {order.seller.name}
                              </Link>
                            </div>
                            <Badge className={`${status.color} border-0 rounded-full`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <p className="text-2xl font-bold text-primary">
                                ${order.total.toFixed(2)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {order.shippingAddress.city}, {order.shippingAddress.state}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Link href={`/messages?order=${order.id}`}>
                                <Button variant="outline" size="sm" className="rounded-full">
                                  <MessageSquare className="w-4 h-4 mr-2" />
                                  Message Seller
                                </Button>
                              </Link>
                              <Link href={`/product/${order.product.id}`}>
                                <Button variant="ghost" size="sm" className="rounded-full">
                                  View Item
                                  <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </TabsContent>

          <TabsContent value="rentals" className="space-y-4">
            {mockRentals.length === 0 ? (
              <Card className="rounded-2xl">
                <CardContent className="flex flex-col items-center py-12">
                  <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No rentals yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Rent items for a fraction of the price
                  </p>
                  <Link href="/search?type=rent">
                    <Button className="rounded-full">Browse Rentals</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              mockRentals.map((rental) => {
                const status = statusConfig[rental.status as keyof typeof statusConfig]
                const StatusIcon = status.icon
                const startDate = new Date(rental.startDate)
                const endDate = new Date(rental.endDate)
                const daysRemaining = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                
                return (
                  <Card key={rental.id} className="rounded-2xl overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        <div className="relative w-full md:w-48 h-48 md:h-auto">
                          <Image
                            src={rental.product.images[0]}
                            alt={rental.product.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 p-6">
                          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">
                                Rental #{rental.id}
                              </p>
                              <h3 className="text-lg font-semibold">{rental.product.title}</h3>
                              <Link 
                                href={`/shop/${rental.seller.id}`}
                                className="text-sm text-primary hover:underline"
                              >
                                From {rental.seller.name}
                              </Link>
                            </div>
                            <Badge className={`${status.color} border-0 rounded-full`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {status.label}
                            </Badge>
                          </div>
                          
                          <div className="bg-muted/50 rounded-xl p-4 mb-4">
                            <div className="flex items-center justify-between text-sm">
                              <div>
                                <p className="text-muted-foreground">Rental Period</p>
                                <p className="font-medium">
                                  {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                                </p>
                              </div>
                              {rental.status === "active" && daysRemaining > 0 && (
                                <div className="text-right">
                                  <p className="text-muted-foreground">Time Remaining</p>
                                  <p className="font-semibold text-primary">{daysRemaining} days</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <p className="text-2xl font-bold text-primary">
                                ${rental.total.toFixed(2)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                ${rental.product.rentPrice}/day x {rental.duration} days
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Link href={`/messages?rental=${rental.id}`}>
                                <Button variant="outline" size="sm" className="rounded-full">
                                  <MessageSquare className="w-4 h-4 mr-2" />
                                  Message Owner
                                </Button>
                              </Link>
                              {rental.status === "active" && (
                                <Button size="sm" className="rounded-full">
                                  Extend Rental
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  )
}
