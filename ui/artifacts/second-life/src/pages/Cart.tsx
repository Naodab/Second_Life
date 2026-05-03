import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import {
  Trash2, ShoppingBag, ArrowRight, Minus, Plus, CalendarDays,
  AlertCircle, CheckCircle2, Loader2, Clock, Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCart, checkRentAvailability, setPendingCheckout, CartItem, CheckoutSelection } from "@/hooks/use-mock-api";
import { formatCurrency, cn } from "@/lib/utils";
import { MOCK_FACILITIES } from "@/lib/mock-data";
import { format, differenceInDays, parseISO, startOfDay } from "date-fns";
import { vi } from "date-fns/locale";

type ModeKey = `${string}:buy` | `${string}:rent`;

interface ItemState {
  buyQty: number;
  rentQty: number;
  rentStart: string;
  rentEnd: string;
  buyStatus: 'idle' | 'checking' | 'ok' | 'error';
  buyMsg: string;
  rentStatus: 'idle' | 'checking' | 'ok' | 'error';
  rentMsg: string;
}

function defaultState(item: CartItem): ItemState {
  return {
    buyQty: item.quantity || 1,
    rentQty: item.quantity || 1,
    rentStart: '',
    rentEnd: '',
    buyStatus: 'idle',
    buyMsg: '',
    rentStatus: 'idle',
    rentMsg: '',
  };
}

/* ── Helpers ────────────────────────────────────────────────── */
function groupByDate(items: CartItem[]) {
  const map = new Map<string, CartItem[]>();
  for (const item of items) {
    const key = format(startOfDay(parseISO(item.addedAt)), 'yyyy-MM-dd');
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return map;
}

function rentDays(start: string, end: string) {
  if (!start || !end) return 0;
  const d = differenceInDays(new Date(end), new Date(start));
  return d > 0 ? d : 0;
}

function calcBuyTotal(item: CartItem, qty: number) {
  return item.buyPrice * qty;
}

function calcRentTotal(item: CartItem, start: string, end: string, qty: number) {
  const days = rentDays(start, end);
  return days > 0 ? item.rentPrice * days * qty : 0;
}

/* ── Status badge ───────────────────────────────────────────── */
function StatusBadge({ status, msg }: { status: 'idle' | 'checking' | 'ok' | 'error'; msg: string }) {
  if (status === 'idle') return null;
  if (status === 'checking') return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Loader2 className="w-3 h-3 animate-spin" /> Đang kiểm tra...
    </span>
  );
  if (status === 'ok') return (
    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
      <CheckCircle2 className="w-3 h-3" /> Có thể đặt
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-xs text-destructive">
      <AlertCircle className="w-3 h-3" /> {msg}
    </span>
  );
}

/* ── Quantity adjuster ──────────────────────────────────────── */
function QtyAdjuster({
  value, min, max, disabled, onChange
}: { value: number; min: number; max: number; disabled: boolean; onChange: (v: number) => void }) {
  return (
    <div className={cn(
      "flex items-center gap-0 border rounded-xl overflow-hidden transition-opacity",
      disabled && "opacity-40 pointer-events-none"
    )}>
      <button
        className="px-3 py-2 hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-40"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >
        <Minus className="w-3 h-3" />
      </button>
      <span className="w-8 text-center text-sm font-bold">{value}</span>
      <button
        className="px-3 py-2 hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-40"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

/* ── Date inputs ────────────────────────────────────────────── */
function DateRangePicker({
  start, end, disabled,
  onStartChange, onEndChange
}: {
  start: string; end: string; disabled: boolean;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
}) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const days = rentDays(start, end);
  return (
    <div className={cn("flex flex-wrap items-center gap-2", disabled && "opacity-40 pointer-events-none")}>
      <div className="flex items-center gap-1.5">
        <CalendarDays className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
        <Input
          type="date"
          value={start}
          min={today}
          onChange={e => onStartChange(e.target.value)}
          className="h-8 text-xs rounded-lg w-36 border-secondary/40 focus-visible:ring-secondary/30"
        />
      </div>
      <span className="text-muted-foreground text-xs">→</span>
      <Input
        type="date"
        value={end}
        min={start || today}
        onChange={e => onEndChange(e.target.value)}
        className="h-8 text-xs rounded-lg w-36 border-secondary/40 focus-visible:ring-secondary/30"
      />
      {days > 0 && (
        <Badge variant="outline" className="text-[10px] px-2 py-0 border-secondary/40 text-secondary font-semibold">
          <Clock className="w-2.5 h-2.5 mr-1" />{days} ngày
        </Badge>
      )}
    </div>
  );
}

/* ── Buy sub-row ────────────────────────────────────────────── */
function BuyRow({
  item, state, checked, onCheck, onQtyChange
}: {
  item: CartItem;
  state: ItemState;
  checked: boolean;
  onCheck: (v: boolean) => void;
  onQtyChange: (v: number) => void;
}) {
  const total = calcBuyTotal(item, state.buyQty);
  return (
    <div className={cn(
      "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
      checked ? "bg-primary/5" : "bg-gray-50/60"
    )}>
      <Checkbox checked={checked} onCheckedChange={onCheck} className="flex-shrink-0" />
      <Badge variant="outline" className="text-[10px] px-2 py-0 font-semibold text-primary border-primary/40 flex-shrink-0">
        <Tag className="w-2.5 h-2.5 mr-1" /> Mua
      </Badge>
      <div className="flex-1 min-w-0">
        {checked && (
          <StatusBadge status={state.buyStatus} msg={state.buyMsg} />
        )}
      </div>
      <QtyAdjuster
        value={state.buyQty}
        min={1}
        max={item.stock}
        disabled={!checked}
        onChange={onQtyChange}
      />
      <div className={cn("text-right min-w-[80px]", !checked && "opacity-40")}>
        <p className="text-sm font-bold text-primary">{formatCurrency(total)}</p>
        <p className="text-[10px] text-muted-foreground">{formatCurrency(item.buyPrice)}/sp</p>
      </div>
    </div>
  );
}

/* ── Rent sub-row ───────────────────────────────────────────── */
function RentRow({
  item, state, checked, onCheck, onStartChange, onEndChange
}: {
  item: CartItem;
  state: ItemState;
  checked: boolean;
  onCheck: (v: boolean) => void;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
}) {
  const days = rentDays(state.rentStart, state.rentEnd);
  const total = calcRentTotal(item, state.rentStart, state.rentEnd, state.rentQty);
  return (
    <div className={cn(
      "flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors",
      checked ? "bg-secondary/5" : "bg-gray-50/60"
    )}>
      <Checkbox checked={checked} onCheckedChange={onCheck} className="flex-shrink-0 mt-0.5" />
      <Badge variant="outline" className="text-[10px] px-2 py-0 font-semibold text-secondary border-secondary/40 flex-shrink-0 mt-0.5">
        <CalendarDays className="w-2.5 h-2.5 mr-1" /> Thuê
      </Badge>
      <div className="flex-1 min-w-0">
        <DateRangePicker
          start={state.rentStart}
          end={state.rentEnd}
          disabled={!checked}
          onStartChange={onStartChange}
          onEndChange={onEndChange}
        />
        {checked && <div className="mt-1"><StatusBadge status={state.rentStatus} msg={state.rentMsg} /></div>}
      </div>
      <div className={cn("text-right min-w-[80px] flex-shrink-0", !checked && "opacity-40")}>
        {days > 0 ? (
          <>
            <p className="text-sm font-bold text-secondary">{formatCurrency(total)}</p>
            <p className="text-[10px] text-muted-foreground">{formatCurrency(item.rentPrice)}/ngày</p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Chọn ngày</p>
        )}
      </div>
    </div>
  );
}

/* ── Cart item card ─────────────────────────────────────────── */
function CartItemCard({
  item, state, selection,
  onToggle, onStateChange, onRemove
}: {
  item: CartItem;
  state: ItemState;
  selection: Set<ModeKey>;
  onToggle: (key: ModeKey, v: boolean) => void;
  onStateChange: (id: string, patch: Partial<ItemState>) => void;
  onRemove: (id: string) => void;
}) {
  const facility = MOCK_FACILITIES.find((f) => f.id === item.facilityId);
  const isBuy = item.type === 'buy' || item.type === 'both';
  const isRent = item.type === 'rent' || item.type === 'both';
  const buyKey: ModeKey = `${item.cartItemId}:buy`;
  const rentKey: ModeKey = `${item.cartItemId}:rent`;

  const handleQtyChange = useCallback(async (qty: number) => {
    onStateChange(item.cartItemId, { buyQty: qty, buyStatus: 'checking', buyMsg: '' });
    await new Promise(r => setTimeout(r, 400));
    if (qty > item.stock) {
      onStateChange(item.cartItemId, { buyStatus: 'error', buyMsg: `Chỉ còn ${item.stock} sp` });
    } else {
      onStateChange(item.cartItemId, { buyStatus: 'ok', buyMsg: '' });
    }
  }, [item.cartItemId, item.stock, onStateChange]);

  const handleRentDate = useCallback(async (start: string, end: string) => {
    onStateChange(item.cartItemId, { rentStart: start, rentEnd: end, rentStatus: 'idle', rentMsg: '' });
    if (!start || !end) return;
    const days = rentDays(start, end);
    if (days <= 0) {
      onStateChange(item.cartItemId, { rentStatus: 'error', rentMsg: 'Ngày kết thúc phải sau ngày bắt đầu.' });
      return;
    }
    onStateChange(item.cartItemId, { rentStatus: 'checking', rentMsg: '' });
    const result = await checkRentAvailability(item.productId, start, end, state.rentQty);
    onStateChange(item.cartItemId, result.available
      ? { rentStatus: 'ok', rentMsg: '' }
      : { rentStatus: 'error', rentMsg: result.message || 'Không còn hàng.' }
    );
  }, [item.cartItemId, item.productId, state.rentQty, onStateChange]);

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      {/* Product header */}
      <div className="flex items-center gap-4 p-4 border-b bg-gray-50/40">
        <img
          src={item.images[0]}
          alt={item.name}
          className="w-14 h-14 rounded-xl object-cover border flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <Link href={`/listing/${encodeURIComponent(item.productId)}`}>
            <h3 className="font-bold text-sm line-clamp-1 hover:text-primary transition-colors">{item.name}</h3>
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5">{facility?.name ?? item.facilityId}</p>
          <div className="flex gap-1.5 mt-1.5">
            {isBuy && <Badge className="text-[9px] px-1.5 py-0 bg-primary/10 text-primary border-0 font-semibold">Mua được</Badge>}
            {isRent && <Badge className="text-[9px] px-1.5 py-0 bg-secondary/10 text-secondary border-0 font-semibold">Thuê được</Badge>}
          </div>
        </div>
        <button
          className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-lg hover:bg-destructive/10 flex-shrink-0"
          onClick={() => onRemove(item.cartItemId)}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Controls */}
      <div className="p-3 space-y-2">
        {isBuy && (
          <BuyRow
            item={item}
            state={state}
            checked={selection.has(buyKey)}
            onCheck={v => onToggle(buyKey, !!v)}
            onQtyChange={handleQtyChange}
          />
        )}
        {isRent && (
          <RentRow
            item={item}
            state={state}
            checked={selection.has(rentKey)}
            onCheck={v => onToggle(rentKey, !!v)}
            onStartChange={s => handleRentDate(s, state.rentEnd)}
            onEndChange={e => handleRentDate(state.rentStart, e)}
          />
        )}
      </div>
    </div>
  );
}

export default function Cart() {
  const [, setLocation] = useLocation();
  const { cartItems, removeFromCart, clearCart } = useCart();
  const [itemStates, setItemStates] = useState<Record<string, ItemState>>({});
  const [selection, setSelection] = useState<Set<ModeKey>>(new Set());

  useEffect(() => {
    setItemStates(prev => {
      const next = { ...prev };
      for (const item of cartItems) {
        if (!next[item.cartItemId]) next[item.cartItemId] = defaultState(item);
      }

      for (const k of Object.keys(next)) {
        if (!cartItems.find(i => i.cartItemId === k)) delete next[k];
      }
      return next;
    });
    setSelection(prev => {
      const ids = new Set(cartItems.map(i => i.cartItemId));
      const next = new Set<ModeKey>();
      for (const k of prev) {
        const id = k.split(':')[0];
        if (ids.has(id)) next.add(k);
      }
      return next;
    });
  }, [cartItems]);

  const patchState = useCallback((id: string, patch: Partial<ItemState>) => {
    setItemStates(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }, []);

  const toggleMode = useCallback((key: ModeKey, on: boolean) => {
    setSelection(prev => {
      const next = new Set(prev);
      if (on) next.add(key); else next.delete(key);
      return next;
    });
  }, []);

  const grouped = groupByDate(cartItems);

  const isAllSelected = cartItems.length > 0 && cartItems.every(item => {
    const isBuy = item.type === 'buy' || item.type === 'both';
    const isRent = item.type === 'rent' || item.type === 'both';
    const buyOk = !isBuy || selection.has(`${item.cartItemId}:buy`);
    const rentOk = !isRent || selection.has(`${item.cartItemId}:rent`);
    return buyOk && rentOk;
  });

  const toggleAll = () => {
    if (isAllSelected) {
      setSelection(new Set());
    } else {
      const all = new Set<ModeKey>();
      for (const item of cartItems) {
        if (item.type === 'buy' || item.type === 'both') all.add(`${item.cartItemId}:buy`);
        if (item.type === 'rent' || item.type === 'both') all.add(`${item.cartItemId}:rent`);
      }
      setSelection(all);
    }
  };

  let selectedTotal = 0;
  let selectedCount = 0;
  const canCheckout = selection.size > 0;

  for (const key of selection) {
    const [id, mode] = key.split(':') as [string, 'buy' | 'rent'];
    const item = cartItems.find(i => i.cartItemId === id);
    const st = itemStates[id];
    if (!item || !st) continue;
    if (mode === 'buy') {
      if (st.buyStatus !== 'error') {
        selectedTotal += calcBuyTotal(item, st.buyQty);
        selectedCount++;
      }
    } else {
      if (st.rentStatus !== 'error' && st.rentStart && st.rentEnd) {
        selectedTotal += calcRentTotal(item, st.rentStart, st.rentEnd, st.rentQty);
        selectedCount++;
      }
    }
  }

  const hasErrors = [...selection].some(key => {
    const [id, mode] = key.split(':') as [string, 'buy' | 'rent'];
    const st = itemStates[id];
    if (!st) return false;
    if (mode === 'buy') return st.buyStatus === 'error';
    return st.rentStatus === 'error' || (!st.rentStart || !st.rentEnd);
  });

  const handleCheckout = () => {
    const items: CheckoutSelection[] = [];
    for (const key of selection) {
      const [id, mode] = key.split(':') as [string, 'buy' | 'rent'];
      const item = cartItems.find(i => i.cartItemId === id);
      const st = itemStates[id];
      if (!item || !st) continue;
      if (mode === 'buy' && st.buyStatus !== 'error') {
        items.push({
          cartItemId: `${id}:buy`,
          productId: item.productId,
          name: item.name,
          images: item.images,
          facilityId: item.facilityId,
          buyPrice: item.buyPrice,
          rentPrice: item.rentPrice,
          mode: 'buy',
          quantity: st.buyQty,
        });
      } else if (mode === 'rent' && st.rentStart && st.rentEnd && st.rentStatus !== 'error') {
        items.push({
          cartItemId: `${id}:rent`,
          productId: item.productId,
          name: item.name,
          images: item.images,
          facilityId: item.facilityId,
          buyPrice: item.buyPrice,
          rentPrice: item.rentPrice,
          mode: 'rent',
          quantity: st.rentQty,
          rentalDates: { start: new Date(st.rentStart), end: new Date(st.rentEnd) },
        });
      }
    }
    if (items.length === 0) return;
    setPendingCheckout(items);
    setLocation('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gray-50/30">
        <div className="text-center">
          <div className="w-70 h-70 flex items-center justify-center mx-auto mb-6">
            <img
              src={`${import.meta.env.BASE_URL}images/empty-cart.png`}
              alt="Mọi người trao đổi đồ dùng"
              className="relative z-10 w-full h-auto drop-shadow-2xl object-contain"
            />
          </div>
          <h2 className="text-3xl font-display font-bold mb-3">Giỏ hàng của bạn đang trống</h2>
          <p className="text-muted-foreground mb-8">Có vẻ bạn chưa thêm sản phẩm nào vào giỏ hàng.</p>
          <Link href="/search">
            <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20">Bắt đầu mua sắm</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30 pt-8 pb-36">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Title + select-all */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-display font-bold">Giỏ hàng</h1>
          <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={toggleAll}
            />
            Chọn tất cả
          </label>
        </div>

        {/* Date groups */}
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([dateKey, items]) => {
            const dateLabel = format(new Date(dateKey), "EEEE, dd 'tháng' M, yyyy", { locale: vi });
            return (
              <div key={dateKey}>
                {/* Date header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>{dateLabel}</span>
                  </div>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">{items.length} sản phẩm</span>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  {items.map(item => (
                    <CartItemCard
                      key={item.cartItemId}
                      item={item}
                      state={itemStates[item.cartItemId] || defaultState(item)}
                      selection={selection}
                      onToggle={toggleMode}
                      onStateChange={patchState}
                      onRemove={id => {
                        removeFromCart(id);
                        setSelection(prev => {
                          const next = new Set(prev);
                          next.delete(`${id}:buy`);
                          next.delete(`${id}:rent`);
                          return next;
                        });
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Sticky Checkout Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t py-4 px-4 z-40 shadow-[0_-8px_30px_rgb(0,0,0,0.06)]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            {selectedCount > 0 ? (
              <>
                <p className="text-sm text-muted-foreground">Đã chọn {selectedCount} lượt sản phẩm</p>
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
              className="flex-1 sm:flex-none rounded-full px-10 h-13 shadow-lg shadow-primary/20 text-base font-semibold"
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
