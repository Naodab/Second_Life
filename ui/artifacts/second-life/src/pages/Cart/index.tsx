import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { CalendarDays, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useCart } from "@/hooks/use-cart";
import { buildCheckoutCartHref, setPendingCheckoutLines, type CheckoutLineInput } from "@/checkout/checkout-session";
import { toApiDateTime } from "@/cart/cart-datetime";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CartItemCard } from "./CartLineItems";
import { defaultState, type ItemState, type ModeKey } from "./cart-types";
import { groupByDate, calcBuyTotal, calcRentTotal } from "./cart-utils";

export default function Cart() {
  const [, setLocation] = useLocation();
  const { cartItems, isLoading, removeFromCart, updateCartQuantity } = useCart();
  const [itemStates, setItemStates] = useState<Record<string, ItemState>>({});
  const [selection, setSelection] = useState<Set<ModeKey>>(new Set());

  useEffect(() => {
    setItemStates((prev) => {
      const next = { ...prev };
      for (const item of cartItems) {
        if (!next[item.cartItemId]) next[item.cartItemId] = defaultState(item);
      }

      for (const k of Object.keys(next)) {
        if (!cartItems.find((i) => i.cartItemId === k)) delete next[k];
      }
      return next;
    });
    setSelection((prev) => {
      const ids = new Set(cartItems.map((i) => i.cartItemId));
      const next = new Set<ModeKey>();
      for (const k of prev) {
        const id = k.split(":")[0];
        if (ids.has(id)) next.add(k);
      }
      return next;
    });
  }, [cartItems]);

  const patchState = useCallback((id: string, patch: Partial<ItemState>) => {
    setItemStates((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }, []);

  const toggleMode = useCallback((key: ModeKey, on: boolean) => {
    setSelection((prev) => {
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  const grouped = groupByDate(cartItems);

  const isAllSelected =
    cartItems.length > 0 &&
    cartItems.every((item) => {
      const key: ModeKey = `${item.cartItemId}:${item.type}`;
      return selection.has(key);
    });

  const toggleAll = () => {
    if (isAllSelected) {
      setSelection(new Set());
    } else {
      const all = new Set<ModeKey>();
      for (const item of cartItems) {
        all.add(`${item.cartItemId}:${item.type}`);
      }
      setSelection(all);
    }
  };

  const selectedFacilityIds = new Set<string>();

  let selectedTotal = 0;
  let selectedCount = 0;
  const canCheckout = selection.size > 0;

  for (const key of selection) {
    const [id, mode] = key.split(":") as [string, "buy" | "rent"];
    const item = cartItems.find((i) => i.cartItemId === id);
    const st = itemStates[id];
    if (!item || !st) continue;
    if (mode === "buy") {
      if (st.buyStatus !== "error") {
        selectedTotal += calcBuyTotal(item, st.buyQty);
        selectedCount++;
        if (item.facilityId) selectedFacilityIds.add(item.facilityId);
      }
    } else {
      if (st.rentStatus !== "error" && st.rentStart && st.rentEnd) {
        selectedTotal += calcRentTotal(item, st.rentStart, st.rentEnd, st.rentQty);
        selectedCount++;
        if (item.facilityId) selectedFacilityIds.add(item.facilityId);
      }
    }
  }

  const hasErrors = [...selection].some((key) => {
    const [id, mode] = key.split(":") as [string, "buy" | "rent"];
    const st = itemStates[id];
    if (!st) return false;
    if (mode === "buy") return st.buyStatus === "error";
    return st.rentStatus === "error" || !st.rentStart || !st.rentEnd;
  });

  const handleCheckout = () => {
    if (selection.size === 0 || hasErrors) return;

    const lines: CheckoutLineInput[] = [];

    for (const key of selection) {
      const [id, mode] = key.split(":") as [string, "buy" | "rent"];
      const item = cartItems.find((i) => i.cartItemId === id);
      const st = itemStates[id];
      if (!item || !st) continue;

      if (mode === "buy") {
        if (st.buyStatus === "error") continue;
        lines.push({
          cartItemId: item.cartItemId,
          listingId: item.listingId,
          listingVariantId: item.listingVariantId,
          quantity: st.buyQty,
          mode: "buy",
        });
      } else {
        if (st.rentStatus === "error" || !st.rentStart || !st.rentEnd) continue;
        lines.push({
          cartItemId: item.cartItemId,
          listingId: item.listingId,
          listingVariantId: item.listingVariantId,
          quantity: st.rentQty,
          mode: "rent",
          rentalStart: toApiDateTime(new Date(`${st.rentStart}T00:00:00`)),
          rentalEnd: toApiDateTime(new Date(`${st.rentEnd}T23:59:59`)),
          rentUnit: item.rentUnit,
        });
      }
    }

    if (lines.length === 0) return;

    setPendingCheckoutLines(lines);
    setLocation(buildCheckoutCartHref());
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-muted/20 dark:bg-background">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          Đang tải giỏ hàng...
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-muted/20 dark:bg-background">
        <div className="text-center px-4">
          <div className="w-70 h-70 flex items-center justify-center mx-auto mb-6">
            <img
              src={`${import.meta.env.BASE_URL}images/empty-cart.png`}
              alt="Mọi người trao đổi đồ dùng"
              className="relative z-10 w-full h-auto drop-shadow-2xl object-contain dark:opacity-90"
            />
          </div>
          <h2 className="text-3xl font-display font-bold mb-3 text-foreground">Giỏ hàng của bạn đang trống</h2>
          <p className="text-muted-foreground mb-8">Có vẻ bạn chưa thêm sản phẩm nào vào giỏ hàng.</p>
          <Link href="/search">
            <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20 dark:shadow-primary/10">
              Bắt đầu mua sắm
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 dark:bg-background pt-8 pb-36">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-display font-bold text-foreground">Giỏ hàng</h1>
          <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <Checkbox checked={isAllSelected} onCheckedChange={toggleAll} />
            Chọn tất cả
          </label>
        </div>

        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([dateKey, items]) => {
            const dateLabel = format(new Date(dateKey), "EEEE, dd 'tháng' M, yyyy", { locale: vi });
            return (
              <div key={dateKey}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>{dateLabel}</span>
                  </div>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">{items.length} sản phẩm</span>
                </div>

                <div className="space-y-3">
                  {items.map((item) => (
                    <CartItemCard
                      key={item.cartItemId}
                      item={item}
                      state={itemStates[item.cartItemId] || defaultState(item)}
                      selection={selection}
                      onToggle={toggleMode}
                      onStateChange={patchState}
                      onQtyPersist={(id, quantity) => void updateCartQuantity(id, quantity)}
                      onRemove={(id) => {
                        setItemStates((prev) => {
                          const next = { ...prev };
                          delete next[id];
                          return next;
                        });
                        setSelection((prev) => {
                          const next = new Set(prev);
                          next.delete(`${id}:buy`);
                          next.delete(`${id}:rent`);
                          return next;
                        });
                        void removeFromCart(id);
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/90 backdrop-blur-xl py-4 px-4 shadow-[0_-8px_30px_rgb(0,0,0,0.06)] dark:bg-card/95 dark:shadow-[0_-8px_30px_rgb(0,0,0,0.35)]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            {selectedCount > 0 ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Đã chọn {selectedCount} mục
                  {selectedFacilityIds.size > 1 ? ` · ${selectedFacilityIds.size} cửa hàng` : ""}
                </p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(selectedTotal)}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa chọn sản phẩm nào</p>
            )}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {hasErrors && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> Có mục không hợp lệ
              </p>
            )}
            <Button
              size="lg"
              className="flex-1 sm:flex-none rounded-full px-10 h-13 shadow-lg shadow-primary/20 dark:shadow-primary/10 text-base font-semibold"
              disabled={!canCheckout || hasErrors}
              onClick={handleCheckout}
            >
              Thanh toán <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
