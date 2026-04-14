"use client"

import { useRef } from 'react'
import Link from 'next/link'
import { mockCategories } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Sofa, Laptop, Shirt, Home, Dumbbell, BookOpen, Baby, Car, Smartphone, Table2, Armchair, BedDouble, Tablet, Camera, ShoppingBag, Footprints, Watch, Lamp, UtensilsCrossed, Flower2, Archive, Mountain, Waves, Trophy, Music, Film, Gamepad2, ToyBrick, GraduationCap, Bike, Wrench } from 'lucide-react'

const iconMap: Record<string, React.ElementType> = {
  Sofa,
  Laptop,
  Shirt,
  Home,
  Dumbbell,
  BookOpen,
  Baby,
  Car,
  Smartphone,
  Table: Table2,
  Armchair,
  Bed: BedDouble,
  Tablet,
  Camera,
  ShoppingBag,
  Footprints,
  Watch,
  Lamp,
  UtensilsCrossed,
  Flower2,
  Archive,
  Mountain,
  Waves,
  Trophy,
  Music,
  Film,
  Gamepad2,
  ToyBrick,
  GraduationCap,
  Bike,
  Wrench,
}

export function CategorySlider() {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const subcategories = mockCategories.flatMap(cat => 
    cat.subcategories.map(sub => ({
      ...sub,
      parentName: cat.name
    }))
  )

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Danh muc san pham</h2>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full h-9 w-9"
              onClick={() => scroll('left')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full h-9 w-9"
              onClick={() => scroll('right')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {subcategories.map((subcategory) => {
            const IconComponent = iconMap[subcategory.icon] || Sofa
            return (
              <Link
                key={subcategory.id}
                href={`/search?category=${subcategory.id}`}
                className="flex-shrink-0 group"
              >
                <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors min-w-[100px]">
                  <div className="h-12 w-12 rounded-xl bg-background flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-medium text-center whitespace-nowrap">
                    {subcategory.name}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
