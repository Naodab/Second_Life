import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  Search, ShoppingCart, Bell, MessageSquare, User, ChevronDown, LogOut,
  Package, Store, ShoppingBag, Truck, CheckCircle2, Tag, X, Info
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import { SELLER_HUB_HOME } from "@/lib/seller-hub-paths";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface Notification {
  id: string;
  type: 'order' | 'payment' | 'message' | 'system' | 'delivery';
  title: string;
  body: string;
  time: Date;
  read: boolean;
  link?: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1", type: "payment", title: "Thanh toán thành công",
    body: "Đơn hàng #o4 đã được thanh toán 1.200.000đ qua PayOS.",
    time: new Date(Date.now() - 1000 * 60 * 5), read: false, link: "/orders"
  },
  {
    id: "n2", type: "order", title: "Đơn hàng mới",
    body: "Linh Nguyễn vừa đặt mua Ghế Mây Bohemian. Vui lòng xác nhận đơn.",
    time: new Date(Date.now() - 1000 * 60 * 30), read: false, link: SELLER_HUB_HOME
  },
  {
    id: "n3", type: "delivery", title: "Đơn hàng đang giao",
    body: "Máy ảnh Film Vintage của bạn đang được vận chuyển. Dự kiến nhận hôm nay.",
    time: new Date(Date.now() - 1000 * 60 * 60 * 2), read: false, link: "/orders"
  },
  {
    id: "n4", type: "message", title: "Tin nhắn mới từ Tech Recycle",
    body: "\"Bạn muốn thuê lều bao nhiêu ngày? Hiện còn 2 chiếc.\"",
    time: new Date(Date.now() - 1000 * 60 * 60 * 5), read: true, link: "/messages"
  },
  {
    id: "n5", type: "system", title: "Chào mừng đến Second Life!",
    body: "Khám phá hàng nghìn sản phẩm đã qua sử dụng chất lượng cao. Mua, thuê, bán dễ dàng.",
    time: new Date(Date.now() - 1000 * 60 * 60 * 24), read: true, link: "/"
  },
];

const NOTIF_ICONS: Record<string, React.ReactNode> = {
  order: <ShoppingBag className="w-4 h-4 text-amber-500" />,
  payment: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  message: <MessageSquare className="w-4 h-4 text-blue-500" />,
  system: <Info className="w-4 h-4 text-primary" />,
  delivery: <Truck className="w-4 h-4 text-purple-500" />,
};

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [, navigate] = useLocation();
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const markRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  return (
    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl border shadow-xl z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50/60">
        <div className="flex items-center gap-2">
          <h3 className="font-bold">Thông báo</h3>
          {unreadCount > 0 && (
            <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadCount} mới</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline">Đọc tất cả</button>
          )}
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[420px]">
        {notifications.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Không có thông báo nào
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => { markRead(notif.id); if (notif.link) navigate(notif.link); onClose(); }}
              className={cn(
                "flex gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors border-b last:border-0",
                !notif.read && "bg-primary/3"
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                notif.type === 'payment' ? "bg-green-50" :
                  notif.type === 'order' ? "bg-amber-50" :
                    notif.type === 'message' ? "bg-blue-50" :
                      notif.type === 'delivery' ? "bg-purple-50" : "bg-primary/10"
              )}>
                {NOTIF_ICONS[notif.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn("text-sm leading-snug", !notif.read ? "font-semibold" : "font-medium text-muted-foreground")}>{notif.title}</p>
                  {!notif.read && <span className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">{notif.body}</p>
                <p className="text-[10px] text-muted-foreground/70 mt-1">
                  {formatDistanceToNow(notif.time, { locale: vi, addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-4 py-2.5 border-t bg-gray-50/60">
        <Link href="/orders" onClick={onClose} className="text-xs text-primary hover:underline flex items-center justify-center gap-1">
          <Package className="w-3 h-3" /> Xem tất cả hoạt động
        </Link>
      </div>
    </div>
  );
}

export function Header() {
  const [location] = useLocation();
  const { user, isLoggedIn, logout } = useAuth();
  const { cartItems } = useCart();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const unreadCount = MOCK_NOTIFICATIONS.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen]);

  if (location.startsWith("/manage") || location.startsWith("/listings")) return null;

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
          <div className="flex-1 max-w-2xl hidden md:flex">
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Tìm kiếm điện tử, quần áo, nội thất..."
                className="w-full pl-10 pr-4 py-6 rounded-full border-border bg-background focus-visible:ring-primary/20 shadow-inner"
              />
              <Button className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full px-6" size="sm">
                Tìm
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Search className="h-5 w-5" />
            </Button>

            {isLoggedIn ? (
              <>
                <Link href="/messages">
                  <Button variant="ghost" size="icon" className="relative text-foreground hover:bg-primary/10 rounded-full">
                    <MessageSquare className="h-5 w-5" />
                    <span className="absolute top-1 right-1 h-2 w-2 bg-secondary rounded-full" />
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

                {/* Notification Bell */}
                <div ref={notifRef} className="relative hidden sm:block">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-foreground hover:bg-primary/10 rounded-full"
                    onClick={() => setNotifOpen(v => !v)}
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-primary text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                  {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
                </div>

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
                    <Link href={SELLER_HUB_HOME}>
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

      {/* Listing row below main header */}
      <div className="flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground py-2">
            <Link href="/search?type=buy" className="hover:text-primary transition-colors">Mua</Link>
            <Link href="/search" className="hover:text-primary transition-colors">Mua & Thuê</Link>
            <Link href="/search?type=rent" className="hover:text-primary transition-colors">Thuê</Link>
          </div>
        </div>
      </div>
    </header>
  );
}
