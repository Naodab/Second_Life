"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { AuthModal } from "@/components/auth/auth-modal"
import { categories } from "@/lib/mock-data"
import { toast } from "sonner"
import { 
  ArrowLeft,
  Upload,
  X,
  Plus,
  Package,
  DollarSign,
  Calendar,
  Info
} from "lucide-react"

const conditions = [
  { value: "new", label: "New with tags" },
  { value: "like-new", label: "Like new" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
]

export default function NewListingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    condition: "",
    buyPrice: "",
    rentEnabled: false,
    rentPrice: "",
    location: "",
  })
  
  const [images, setImages] = useState<string[]>([])

  const handleImageUpload = () => {
    // Simulate image upload with placeholder images
    const placeholderImages = [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400",
    ]
    const randomImage = placeholderImages[Math.floor(Math.random() * placeholderImages.length)]
    if (images.length < 8) {
      setImages([...images, randomImage])
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setShowAuthModal(true)
      return
    }

    if (images.length === 0) {
      toast.error("Please add at least one image")
      return
    }

    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    toast.success("Listing created successfully!")
    router.push("/my-listings")
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
              <Package className="w-12 h-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Sign in to create a listing</h1>
            <p className="text-muted-foreground mb-6">
              Start selling or renting your items today
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
        <div className="max-w-3xl mx-auto">
          <Link 
            href="/my-listings" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Listings
          </Link>

          <h1 className="text-3xl font-bold mb-8">Create New Listing</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Images */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Photos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                      <Image
                        src={image}
                        alt={`Upload ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-2 left-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                          Cover
                        </span>
                      )}
                    </div>
                  ))}
                  {images.length < 8 && (
                    <button
                      type="button"
                      onClick={handleImageUpload}
                      className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-muted/50 transition-colors"
                    >
                      <Plus className="w-6 h-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Add Photo</span>
                    </button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Add up to 8 photos. First photo will be the cover image.
                </p>
              </CardContent>
            </Card>

            {/* Basic Info */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="What are you selling?"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="rounded-xl mt-1.5"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your item in detail..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="rounded-xl mt-1.5 min-h-[120px]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="rounded-xl mt-1.5">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Condition</Label>
                    <Select
                      value={formData.condition}
                      onValueChange={(value) => setFormData({ ...formData, condition: value })}
                    >
                      <SelectTrigger className="rounded-xl mt-1.5">
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {conditions.map((condition) => (
                          <SelectItem key={condition.value} value={condition.value}>
                            {condition.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="City, State"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="rounded-xl mt-1.5"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="buyPrice">Selling Price</Label>
                  <div className="relative mt-1.5">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="buyPrice"
                      type="number"
                      placeholder="0.00"
                      value={formData.buyPrice}
                      onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                      className="rounded-xl pl-8"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Enable Renting</p>
                      <p className="text-sm text-muted-foreground">
                        Allow others to rent this item
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.rentEnabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, rentEnabled: checked })}
                  />
                </div>

                {formData.rentEnabled && (
                  <div>
                    <Label htmlFor="rentPrice">Daily Rental Price</Label>
                    <div className="relative mt-1.5">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="rentPrice"
                        type="number"
                        placeholder="0.00"
                        value={formData.rentPrice}
                        onChange={(e) => setFormData({ ...formData, rentPrice: e.target.value })}
                        className="rounded-xl pl-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">/day</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Recommended: 5-10% of selling price per day
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-full"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 rounded-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Listing"}
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  )
}
