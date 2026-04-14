"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { CategorySlider } from '@/components/home/category-slider'
import { RecommendedSection } from '@/components/home/recommended-section'
import { AboutSection } from '@/components/home/about-section'

export default function HomePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('all')

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}&type=${activeTab}`)
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header 
        onSearchChange={handleSearch} 
        onTabChange={handleTabChange}
        activeTab={activeTab}
      />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-12 md:py-20 overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-10 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
          </div>
          
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-balance">
              Cho do vat cuoc song{' '}
              <span className="text-primary">thu hai</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 text-balance">
              Kham pha nhung mon hoi hap dan. Mua hoac thue noi that, dien tu, 
              thoi trang chat luong tu nhung nguoi ban dang tin cay.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/80 text-sm">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                50,000+ san pham
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/80 text-sm">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Nguoi ban xac minh
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/80 text-sm">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Thanh toan an toan
              </div>
            </div>
          </div>
        </section>

        <CategorySlider />
        <RecommendedSection />
        <AboutSection />
      </main>

      <Footer />
    </div>
  )
}
