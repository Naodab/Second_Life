"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useCart } from '@/contexts/cart-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Bell, 
  MessageCircle, 
  ShoppingCart, 
  Store,
  User,
  Settings,
  Package,
  History,
  LogOut,
  Leaf,
  Menu,
} from 'lucide-react'
import { AuthModal } from '@/components/auth/auth-modal'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

interface HeaderProps {
  showSearch?: boolean
  onSearchChange?: (query: string) => void
  onTabChange?: (tab: string) => void
  activeTab?: string
}

export function Header({ showSearch = true, onSearchChange, onTabChange, activeTab = 'all' }: HeaderProps) {
  const router = useRouter()
  const { user, isLoggedIn, logout } = useAuth()
  const { totalItems } = useCart()
  const [searchQuery, setSearchQuery] = useState('')
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const notificationCount = 3
  const messageCount = 2

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      if (onSearchChange) {
        onSearchChange(searchQuery)
      } else {
        router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
      }
    }
  }

  const openLogin = () => {
    setAuthMode('login')
    setAuthModalOpen(true)
  }

  const openRegister = () => {
    setAuthMode('register')
    setAuthModalOpen(true)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        {/* Main header row */}
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="hidden font-semibold text-lg text-foreground sm:inline-block">
              Second Life
            </span>
          </Link>

          {/* Search - Desktop */}
          {showSearch && (
            <div className="hidden md:flex flex-1 max-w-xl">
              <form onSubmit={handleSearch} className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Tim kiem noi that, dien tu, thoi trang..."
                  className="w-full pl-10 pr-4 h-10 rounded-full bg-secondary border-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
            </div>
          )}

          {/* Right section */}
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <>
                {/* Desktop actions */}
                <div className="hidden md:flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="relative rounded-full" asChild>
                    <Link href="/notifications">
                      <Bell className="h-5 w-5" />
                      {notificationCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                          {notificationCount}
                        </Badge>
                      )}
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" className="relative rounded-full" asChild>
                    <Link href="/messages">
                      <MessageCircle className="h-5 w-5" />
                      {messageCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                          {messageCount}
                        </Badge>
                      )}
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" className="relative rounded-full" asChild>
                    <Link href="/cart">
                      <ShoppingCart className="h-5 w-5" />
                      {totalItems > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                          {totalItems}
                        </Badge>
                      )}
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full" asChild>
                    <Link href="/my-listings">
                      <Store className="h-5 w-5" />
                    </Link>
                  </Button>
                </div>

                {/* User dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 rounded-full pl-2 pr-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar} alt={user?.fullName} />
                        <AvatarFallback>{user?.fullName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="hidden lg:inline text-sm font-medium">{user?.fullName}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl">
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Ho so
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Cai dat tai khoan
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orders" className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Don hang cua toi
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/history" className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Lich su xem
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Dang xuat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mobile menu */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild className="md:hidden">
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80">
                    <div className="flex flex-col gap-4 mt-6">
                      <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="Tim kiem..."
                          className="w-full pl-10 pr-4 rounded-full bg-secondary border-0"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </form>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { key: 'all', label: 'Tat ca' },
                          { key: 'buy', label: 'Mua' },
                          { key: 'both', label: 'Mua & Thue' },
                          { key: 'rent', label: 'Thue' }
                        ].map(tab => (
                          <Button
                            key={tab.key}
                            variant={activeTab === tab.key ? 'default' : 'secondary'}
                            size="sm"
                            className="rounded-full text-xs"
                            onClick={() => {
                              onTabChange?.(tab.key)
                              setMobileMenuOpen(false)
                            }}
                          >
                            {tab.label}
                          </Button>
                        ))}
                      </div>
                      <div className="border-t pt-4 space-y-2">
                        <Link href="/notifications" className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary" onClick={() => setMobileMenuOpen(false)}>
                          <Bell className="h-5 w-5" />
                          <span>Thong bao</span>
                          {notificationCount > 0 && <Badge className="ml-auto">{notificationCount}</Badge>}
                        </Link>
                        <Link href="/messages" className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary" onClick={() => setMobileMenuOpen(false)}>
                          <MessageCircle className="h-5 w-5" />
                          <span>Tin nhan</span>
                          {messageCount > 0 && <Badge className="ml-auto">{messageCount}</Badge>}
                        </Link>
                        <Link href="/cart" className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary" onClick={() => setMobileMenuOpen(false)}>
                          <ShoppingCart className="h-5 w-5" />
                          <span>Gio hang</span>
                          {totalItems > 0 && <Badge className="ml-auto">{totalItems}</Badge>}
                        </Link>
                        <Link href="/my-listings" className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary" onClick={() => setMobileMenuOpen(false)}>
                          <Store className="h-5 w-5" />
                          <span>San pham cua toi</span>
                        </Link>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            ) : (
              <>
                <Button variant="ghost" className="rounded-full hidden sm:flex" onClick={openLogin}>
                  Dang nhap
                </Button>
                <Button className="rounded-full" onClick={openRegister}>
                  Dang ky
                </Button>
                {/* Mobile menu for guest */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild className="sm:hidden">
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80">
                    <div className="flex flex-col gap-4 mt-6">
                      <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="Tim kiem..."
                          className="w-full pl-10 pr-4 rounded-full bg-secondary border-0"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </form>
                      <div className="flex flex-col gap-2">
                        <Button className="rounded-full w-full" onClick={() => { openRegister(); setMobileMenuOpen(false) }}>
                          Dang ky
                        </Button>
                        <Button variant="outline" className="rounded-full w-full" onClick={() => { openLogin(); setMobileMenuOpen(false) }}>
                          Dang nhap
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            )}
          </div>
        </div>

        {/* Tabs row - separate from main header */}
        {showSearch && (
          <div className="hidden md:flex justify-center pb-3">
            <Tabs value={activeTab} onValueChange={onTabChange} className="w-auto">
              <TabsList className="bg-secondary/50 h-9 gap-1 p-1 rounded-full">
                <TabsTrigger 
                  value="all" 
                  className="text-xs rounded-full px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Tat ca
                </TabsTrigger>
                <TabsTrigger 
                  value="buy" 
                  className="text-xs rounded-full px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Mua
                </TabsTrigger>
                <TabsTrigger 
                  value="both" 
                  className="text-xs rounded-full px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Mua & Thue
                </TabsTrigger>
                <TabsTrigger 
                  value="rent" 
                  className="text-xs rounded-full px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Thue
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}
      </div>

      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen} 
        defaultMode={authMode}
      />
    </header>
  )
}
