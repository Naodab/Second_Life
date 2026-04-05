import { Link, useLocation } from "wouter";
import { Search, ShoppingCart, Bell, MessageSquare, User, ChevronDown, LogOut, Package, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCart } from "@/hooks/use-mock-api";

export function Header() {
  const [location] = useLocation();
  const { user, isLoggedIn, logout } = useAuth();
  const { cartItems } = useCart();
  
  if (location.startsWith('/listings')) return null;

  return (
    <header className="sticky top-0 z-50 w-full glass border-b transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-primary/20 p-2 rounded-xl group-hover:bg-primary/30 transition-colors">
                <img 
                  src={`${import.meta.env.BASE_URL}images/logo-leaf.png`} 
                  alt="Logo Second Life" 
                  className="w-8 h-8 object-contain"
                />
              </div>
              <span className="font-display font-bold text-2xl text-foreground hidden sm:block tracking-tight">
                Second <span className="text-primary">Life</span>
              </span>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl hidden md:flex flex-col">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Tìm kiếm điện tử, quần áo, nội thất..." 
                className="w-full pl-10 pr-4 py-6 rounded-full border-border bg-background focus-visible:ring-primary/20 shadow-inner"
              />
              <Button className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full px-6" size="sm">
                Tìm
              </Button>
            </div>
            <div className="flex gap-6 mt-2 ml-4 text-sm font-medium text-muted-foreground">
              <Link href="/search?type=buy" className="hover:text-primary transition-colors">Mua</Link>
              <Link href="/search" className="hover:text-primary transition-colors">Mua & Thuê</Link>
              <Link href="/search?type=rent" className="hover:text-primary transition-colors">Thuê</Link>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Search className="h-5 w-5" />
            </Button>

            {isLoggedIn ? (
              <>
                <Link href="/messages">
                  <Button variant="ghost" size="icon" className="relative text-foreground hover:bg-primary/10 rounded-full">
                    <MessageSquare className="h-5 w-5" />
                    <span className="absolute top-1 right-1 h-2 w-2 bg-secondary rounded-full"></span>
                  </Button>
                </Link>
                
                <Link href="/cart">
                  <Button variant="ghost" size="icon" className="relative text-foreground hover:bg-primary/10 rounded-full">
                    <ShoppingCart className="h-5 w-5" />
                    {cartItems.length > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                        {cartItems.length}
                      </span>
                    )}
                  </Button>
                </Link>

                <Button variant="ghost" size="icon" className="text-foreground hover:bg-primary/10 rounded-full hidden sm:flex">
                  <Bell className="h-5 w-5" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="pl-2 pr-1 py-1 h-10 rounded-full hover:bg-primary/10 border border-transparent hover:border-primary/20 flex items-center gap-2">
                      <Avatar className="h-8 w-8 border border-white shadow-sm">
                        <AvatarImage src={user?.avatar || ""} />
                        <AvatarFallback className="bg-primary/20 text-primary"><User className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-semibold hidden lg:block">{user?.name}</span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground hidden lg:block" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl">
                    <div className="flex items-center gap-3 p-2 mb-2">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.avatar || ""} />
                        <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{user?.name}</span>
                        <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <Link href="/orders">
                      <DropdownMenuItem className="cursor-pointer py-3 rounded-xl font-medium">
                        <Package className="mr-2 h-4 w-4 text-primary" /> Đơn hàng của tôi
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/listings">
                      <DropdownMenuItem className="cursor-pointer py-3 rounded-xl font-medium">
                        <Store className="mr-2 h-4 w-4 text-secondary" /> Quản lý bán hàng
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer py-3 rounded-xl text-destructive focus:bg-destructive/10 font-medium" onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" className="hidden sm:flex font-semibold hover:bg-primary/10 rounded-full px-6">Đăng nhập</Button>
                </Link>
                <Link href="/register">
                  <Button className="font-semibold rounded-full px-6 shadow-md shadow-primary/20">Đăng ký</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
