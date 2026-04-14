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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
import { AuthModal } from "@/components/auth/auth-modal"
import { mockUserListings } from "@/lib/mock-data"
import { 
  Package, 
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Calendar
} from "lucide-react"

const statusConfig = {
  active: { label: "Active", color: "bg-green-100 text-green-700" },
  paused: { label: "Paused", color: "bg-amber-100 text-amber-700" },
  sold: { label: "Sold", color: "bg-blue-100 text-blue-700" },
  rented: { label: "Currently Rented", color: "bg-primary/20 text-primary" },
}

export default function MyListingsPage() {
  const { user } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  const activeListings = mockUserListings.filter(l => l.status === "active" || l.status === "paused")
  const soldListings = mockUserListings.filter(l => l.status === "sold")
  const rentedListings = mockUserListings.filter(l => l.status === "rented")

  const totalViews = mockUserListings.reduce((acc, l) => acc + l.views, 0)
  const totalEarnings = soldListings.reduce((acc, l) => acc + l.buyPrice, 0) +
    rentedListings.reduce((acc, l) => acc + (l.rentPrice || 0) * 30, 0)

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
              <Package className="w-12 h-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Sign in to manage your listings</h1>
            <p className="text-muted-foreground mb-6">
              List items for sale or rent and track your earnings
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
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold">My Listings</h1>
          <Link href="/my-listings/new">
            <Button className="rounded-full">
              <Plus className="w-4 h-4 mr-2" />
              New Listing
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{activeListings.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Views</p>
                  <p className="text-2xl font-bold">{totalViews}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Earnings</p>
                  <p className="text-2xl font-bold">${totalEarnings}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rented</p>
                  <p className="text-2xl font-bold">{rentedListings.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
            <TabsTrigger value="active" className="rounded-full">
              Active ({activeListings.length})
            </TabsTrigger>
            <TabsTrigger value="sold" className="rounded-full">
              Sold ({soldListings.length})
            </TabsTrigger>
            <TabsTrigger value="rented" className="rounded-full">
              Rented ({rentedListings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeListings.length === 0 ? (
              <Card className="rounded-2xl">
                <CardContent className="flex flex-col items-center py-12">
                  <Package className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No active listings</h3>
                  <p className="text-muted-foreground mb-4">
                    Start selling or renting your items
                  </p>
                  <Link href="/my-listings/new">
                    <Button className="rounded-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Listing
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              activeListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))
            )}
          </TabsContent>

          <TabsContent value="sold" className="space-y-4">
            {soldListings.length === 0 ? (
              <Card className="rounded-2xl">
                <CardContent className="flex flex-col items-center py-12">
                  <DollarSign className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No sold items yet</h3>
                  <p className="text-muted-foreground">
                    Your sold items will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              soldListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))
            )}
          </TabsContent>

          <TabsContent value="rented" className="space-y-4">
            {rentedListings.length === 0 ? (
              <Card className="rounded-2xl">
                <CardContent className="flex flex-col items-center py-12">
                  <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No rented items</h3>
                  <p className="text-muted-foreground">
                    Items you rent out will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              rentedListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  )
}

interface ListingCardProps {
  listing: typeof mockUserListings[0]
}

function ListingCard({ listing }: ListingCardProps) {
  const status = statusConfig[listing.status as keyof typeof statusConfig]

  return (
    <Card className="rounded-2xl overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          <div className="relative w-full md:w-48 h-48 md:h-auto">
            <Image
              src={listing.images[0]}
              alt={listing.title}
              fill
              className="object-cover"
            />
            {listing.status === "paused" && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <EyeOff className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">{listing.title}</h3>
                  <Badge className={`${status.color} border-0 rounded-full`}>
                    {status.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Listed {new Date(listing.createdAt).toLocaleDateString()}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Listing
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    {listing.status === "paused" ? (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Activate
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" />
                        Pause
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex flex-wrap gap-6 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Buy Price</p>
                <p className="text-xl font-bold text-primary">${listing.buyPrice}</p>
              </div>
              {listing.rentPrice && (
                <div>
                  <p className="text-sm text-muted-foreground">Rent Price</p>
                  <p className="text-xl font-bold">${listing.rentPrice}/day</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Views</p>
                <p className="text-xl font-bold">{listing.views}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Favorites</p>
                <p className="text-xl font-bold">{listing.favorites}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href={`/product/${listing.id}`}>
                <Button variant="outline" size="sm" className="rounded-full">
                  <Eye className="w-4 h-4 mr-2" />
                  View Listing
                </Button>
              </Link>
              {listing.status === "active" && (
                <Button variant="outline" size="sm" className="rounded-full">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Boost
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
