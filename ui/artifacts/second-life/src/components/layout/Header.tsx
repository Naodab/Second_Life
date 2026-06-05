import { useState, useRef, useEffect, useMemo, FormEvent, useCallback } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Search, ShoppingCart, Bell, MessageSquare, User, ChevronDown, LogOut,
  Package, Store, ShoppingBag, Truck, CheckCircle2, X, Info
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { useCart } from "@/hooks/use-cart";
import { useNotifications, type UiNotification } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import { buildFreshSearchPath, buildSearchPath } from "@/lib/search-url";
import { pathnameEndsWithSegment, rawQueryFromBrowserSearch } from "@/lib/wouter-location";
import { fetchListingSuggestions, type ListingSuggestionResponse } from "@/api/listing";
import { guardSellerHubNavigation } from "@/components/SellerHubProfileGate";
import { SELLER_HUB_HOME } from "@/lib/seller-hub-paths";
import { ThemeToggle } from "@/components/theme-toggle";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface Notification {
  id: string;
  type: UiNotification["type"];
  title: string;
  body: string;
  time: Date;
  read: boolean;
  link?: string;
}

function navigateNotificationLink(link: string, navigate: (path: string) => void) {
  try {
    const url = new URL(link, window.location.origin);
    navigate(`${url.pathname}${url.search}${url.hash}`);
  } catch {
    navigate(link);
  }
}

const NOTIF_ICONS: Record<string, React.ReactNode> = {
  order: <ShoppingBag className="w-4 h-4 text-amber-500" />,
  payment: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  message: <MessageSquare className="w-4 h-4 text-blue-500" />,
  system: <Info className="w-4 h-4 text-primary" />,
  delivery: <Truck className="w-4 h-4 text-purple-500" />,
};

function NotificationPanel({
  onClose,
  notifications,
  unreadCount,
  isLoading,
  onMarkRead,
  onMarkAllRead,
}: {
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}) {
  const [, navigate] = useLocation();

  return (
    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border bg-card text-card-foreground shadow-xl z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <h3 className="font-bold">Thông báo</h3>
          {unreadCount > 0 && (
            <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadCount} mới</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={onMarkAllRead} className="text-xs text-primary hover:underline">Đọc tất cả</button>
          )}
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[420px]">
        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground text-sm">Đang tải thông báo...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Không có thông báo nào
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                onMarkRead(notif.id);
                if (notif.link) navigateNotificationLink(notif.link, navigate);
                onClose();
              }}
              className={cn(
                "flex gap-3 px-4 py-3.5 cursor-pointer hover:bg-muted/60 transition-colors border-b last:border-0",
                !notif.read && "bg-primary/3",
              )}
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                  notif.type === "payment"
                    ? "bg-green-50"
                    : notif.type === "order"
                      ? "bg-amber-50"
                      : notif.type === "message"
                        ? "bg-blue-50"
                        : notif.type === "delivery"
                          ? "bg-purple-50"
                          : "bg-primary/10",
                )}
              >
                {NOTIF_ICONS[notif.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={cn(
                      "text-sm leading-snug",
                      !notif.read ? "font-semibold" : "font-medium text-muted-foreground",
                    )}
                  >
                    {notif.title}
                  </p>
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

      <div className="border-t bg-muted/50 px-4 py-2.5">
        <Link href="/orders" onClick={onClose} className="text-xs text-primary hover:underline flex items-center justify-center gap-1">
          <Package className="w-3 h-3" /> Xem tất cả hoạt động
        </Link>
      </div>
    </div>
  );
}

const EMPTY_SUGGESTION_ITEMS: ListingSuggestionResponse[] = [];

function SearchSuggestionPanel({
  open,
  loading,
  items,
  onPickListing,
}: {
  open: boolean;
  loading: boolean;
  items: ListingSuggestionResponse[];
  onPickListing: (item: ListingSuggestionResponse) => void;
}) {
  if (!open) return null;
  return (
    <div
      role="listbox"
      className="absolute left-0 right-0 top-[calc(100%+6px)] z-[60] max-h-72 overflow-y-auto rounded-2xl border border-border bg-popover py-2 text-popover-foreground shadow-lg"
      onMouseDown={(e) => e.preventDefault()}
    >
      {loading ? (
        <p className="px-4 py-2 text-xs text-muted-foreground">Đang tải gợi ý...</p>
      ) : items.length === 0 ? (
        <p className="px-4 py-2 text-xs text-muted-foreground">Không có tin phù hợp</p>
      ) : (
        items.map((s) => (
          <button
            key={s.id}
            type="button"
            role="option"
            className="flex w-full cursor-pointer truncate px-4 py-2.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
            onClick={() => onPickListing(s)}
          >
            {s.title}
          </button>
        ))
      )}
    </div>
  );
}

export function Header() {
  const [pathname, setLocation] = useLocation();
  const search = useSearch();
  const { user, isLoggedIn, logout, sellerHubProfileComplete } = useAuth();

  const openSellerHub = () => {
    guardSellerHubNavigation(SELLER_HUB_HOME, { isLoggedIn, sellerHubProfileComplete }, setLocation);
  };
  const { cartItems } = useCart();
  const {
    notifications,
    unreadCount,
    isLoading: notificationsLoading,
    markRead,
    markAllRead,
  } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [debouncedDraft, setDebouncedDraft] = useState("");

  const isSearchPage = pathnameEndsWithSegment(pathname, "search");

  const urlSearchKeyword = useMemo(() => {
    const sp = new URLSearchParams(rawQueryFromBrowserSearch(search) || "");
    return (sp.get("keyword") || sp.get("q") || "").trim();
  }, [search]);

  const [headerSearchDraft, setHeaderSearchDraft] = useState("");

  useEffect(() => {
    if (!isSearchPage) return;
    setHeaderSearchDraft((prev) =>
      prev === urlSearchKeyword ? prev : urlSearchKeyword,
    );
  }, [isSearchPage, urlSearchKeyword]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedDraft(headerSearchDraft.trim()), 400);
    return () => window.clearTimeout(t);
  }, [headerSearchDraft]);

  const { data: suggestionsData, isFetching: suggestLoading } = useQuery({
    queryKey: ["listingSuggestions", debouncedDraft],
    queryFn: () => fetchListingSuggestions(debouncedDraft, 8),
    enabled: debouncedDraft.length >= 2,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });
  const suggestions = suggestionsData ?? EMPTY_SUGGESTION_ITEMS;

  const runHeaderSearch = useCallback(() => {
    const q = headerSearchDraft.trim();
    setSuggestOpen(false);
    if (isSearchPage) {
      const qs = rawQueryFromBrowserSearch(search);
      setLocation(buildSearchPath({ keyword: q || null, q: null }, qs));
    } else {
      setLocation(buildFreshSearchPath({ keyword: q || null, q: null }));
    }
  }, [headerSearchDraft, isSearchPage, search, setLocation]);

  const submitHeaderSearch = (e: FormEvent) => {
    e.preventDefault();
    runHeaderSearch();
  };

  const pickSuggestionListing = (item: ListingSuggestionResponse) => {
    const nextKeyword = item.title.trim();
    setHeaderSearchDraft(nextKeyword);
    setSuggestOpen(false);
    setLocation(buildFreshSearchPath({ keyword: nextKeyword || null, q: null }));
  };

  const showSuggestPanel = suggestOpen && debouncedDraft.length >= 2;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen]);

  if (pathname.startsWith("/manage") || pathname.startsWith("/listings")) return null;

  return (
    <header className="sticky top-0 z-50 w-full glass border-b transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-0">
        <div className="flex h-auto md:h-20 items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-primary/20 p-2 rounded-xl group-hover:bg-primary/30 transition-colors">
                <img
                  src={`${import.meta.env.BASE_URL}favicon.png`}
                  alt="Logo Second Life"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <span className="font-display font-bold text-2xl text-foreground hidden sm:block tracking-tight">
                Second <span className="text-primary">Life</span>
              </span>
            </Link>
          </div>

          {/* Search Bar — desktop/tablet */}
          <div className="flex-1 max-w-2xl min-w-0 hidden md:flex">
            <form className="relative w-full group" onSubmit={submitHeaderSearch}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" aria-hidden />
              <Input
                name="q"
                placeholder="Tìm kiếm điện tử, quần áo, nội thất..."
                className="w-full pl-10 pr-[5.25rem] py-6 rounded-full border-border bg-background focus-visible:ring-primary/20 shadow-inner"
                value={headerSearchDraft}
                autoComplete="off"
                onChange={(ev) => setHeaderSearchDraft(ev.target.value)}
                onFocus={() => setSuggestOpen(true)}
                onBlur={() => setTimeout(() => setSuggestOpen(false), 200)}
              />
              <Button
                type="submit"
                className="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full px-6"
                size="sm"
              >
                Tìm
              </Button>
              <SearchSuggestionPanel
                open={showSuggestPanel}
                loading={suggestLoading}
                items={suggestions}
                onPickListing={pickSuggestionListing}
              />
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 md:gap-3">
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

                <ThemeToggle />

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
                  {notifOpen && (
                    <NotificationPanel
                      onClose={() => setNotifOpen(false)}
                      notifications={notifications}
                      unreadCount={unreadCount}
                      isLoading={notificationsLoading}
                      onMarkRead={markRead}
                      onMarkAllRead={markAllRead}
                    />
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger
                    type="button"
                    className={cn(
                      buttonVariants({ variant: "ghost" }),
                      "h-10 gap-2 rounded-full border border-transparent py-1 pl-2 pr-1 hover:border-primary/20 hover:bg-primary/10",
                    )}
                  >
                    <Avatar className="h-8 w-8 border border-white shadow-sm">
                      <AvatarImage src={user?.avatar || ""} />
                      <AvatarFallback className="bg-primary/20 text-primary"><User className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <span className="hidden text-sm font-semibold lg:block">{user?.name}</span>
                    <ChevronDown className="hidden h-4 w-4 text-muted-foreground lg:block" />
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
                    <DropdownMenuItem
                      className="cursor-pointer py-3 rounded-xl font-medium"
                      onSelect={() => openSellerHub()}
                    >
                      <Store className="mr-2 h-4 w-4 text-secondary" /> Quản lý bán hàng
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer py-3 rounded-xl text-destructive focus:bg-destructive/10 font-medium" onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <ThemeToggle />
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

        {/* Search — mobile (trước đây bị ẩn hoặc nút kính không gắn hành vi) */}
        <div className="mt-3 md:hidden">
          <form className="relative w-full group" onSubmit={submitHeaderSearch}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none z-10" aria-hidden />
            <Input
              name="q"
              placeholder="Tìm đồ tái đời, nội thất..."
              className="w-full pl-10 pr-[5.25rem] py-5 rounded-full border-border bg-background focus-visible:ring-primary/20 shadow-inner"
              value={headerSearchDraft}
              autoComplete="off"
              onChange={(ev) => setHeaderSearchDraft(ev.target.value)}
              onFocus={() => setSuggestOpen(true)}
              onBlur={() => setTimeout(() => setSuggestOpen(false), 200)}
            />
            <Button type="submit" className="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full px-5" size="sm">
              Tìm
            </Button>
            <SearchSuggestionPanel
              open={showSuggestPanel}
              loading={suggestLoading}
              items={suggestions}
              onPickListing={pickSuggestionListing}
            />
          </form>
        </div>
      </div>

      {/* Listing row below main header */}
      <div className="flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground py-2">
            <Link href="/search?listingType=buy" className="hover:text-primary transition-colors">Mua</Link>
            <Link href="/search" className="hover:text-primary transition-colors">Mua & Thuê</Link>
            <Link href="/search?listingType=rent" className="hover:text-primary transition-colors">Thuê</Link>
          </div>
        </div>
      </div>
    </header>
  );
}
