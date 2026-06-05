import { useCallback } from "react";
import { Link } from "wouter";
import { Trash2, CalendarDays, Minus, Plus, Loader2, CheckCircle2, AlertCircle, Clock, Tag } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  fetchListingVariantAvailability,
  fetchListingVariantAvailabilityInRange,
} from "@/api/inventory";
import { formatCurrency, cn } from "@/lib/utils";
import type { ItemState, ModeKey, CartItemView } from "./cart-types";
import { calcBuyTotal, calcRentTotal, rentDays } from "./cart-utils";

function StatusBadge({ status, msg }: { status: "idle" | "checking" | "ok" | "error"; msg: string }) {
  if (status === "idle") return null;
  if (status === "checking")
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" /> Đang kiểm tra...
      </span>
    );
  if (status === "ok")
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
        <CheckCircle2 className="w-3 h-3" /> Có thể đặt
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-xs text-destructive">
      <AlertCircle className="w-3 h-3" /> {msg}
    </span>
  );
}

function QtyAdjuster({
  value,
  min,
  max,
  disabled,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  disabled: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-0 border border-border rounded-xl overflow-hidden transition-opacity",
        disabled && "opacity-40 pointer-events-none",
      )}
    >
      <button
        type="button"
        className="px-3 py-2 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >
        <Minus className="w-3 h-3" />
      </button>
      <span className="w-8 text-center text-sm font-bold text-foreground">{value}</span>
      <button
        type="button"
        className="px-3 py-2 text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

function DateRangePicker({
  start,
  end,
  disabled,
  onStartChange,
  onEndChange,
}: {
  start: string;
  end: string;
  disabled: boolean;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
}) {
  const today = format(new Date(), "yyyy-MM-dd");
  const days = rentDays(start, end);
  return (
    <div className={cn("flex flex-wrap items-center gap-2", disabled && "opacity-40 pointer-events-none")}>
      <div className="flex items-center gap-1.5">
        <CalendarDays className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
        <Input
          type="date"
          value={start}
          min={today}
          onChange={(e) => onStartChange(e.target.value)}
          className="h-8 text-xs rounded-lg w-36 border-secondary/40 bg-background focus-visible:ring-secondary/30 dark:border-secondary/35"
        />
      </div>
      <span className="text-muted-foreground text-xs">→</span>
      <Input
        type="date"
        value={end}
        min={start || today}
        onChange={(e) => onEndChange(e.target.value)}
        className="h-8 text-xs rounded-lg w-36 border-secondary/40 bg-background focus-visible:ring-secondary/30 dark:border-secondary/35"
      />
      {days > 0 && (
        <Badge variant="outline" className="text-[10px] px-2 py-0 border-secondary/40 text-secondary font-semibold">
          <Clock className="w-2.5 h-2.5 mr-1" />
          {days} ngày
        </Badge>
      )}
    </div>
  );
}

function BuyRow({
  item,
  state,
  checked,
  onCheck,
  onQtyChange,
}: {
  item: CartItemView;
  state: ItemState;
  checked: boolean;
  onCheck: (v: boolean) => void;
  onQtyChange: (v: number) => void;
}) {
  const total = calcBuyTotal(item, state.buyQty);
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
        checked ? "bg-primary/5 dark:bg-primary/10" : "bg-muted/40 dark:bg-muted/20",
      )}
    >
      <Checkbox checked={checked} onCheckedChange={onCheck} className="flex-shrink-0" />
      <Badge variant="outline" className="text-[10px] px-2 py-0 font-semibold text-primary border-primary/40 flex-shrink-0">
        <Tag className="w-2.5 h-2.5 mr-1" /> Mua
      </Badge>
      <div className="flex-1 min-w-0">{checked && <StatusBadge status={state.buyStatus} msg={state.buyMsg} />}</div>
      <QtyAdjuster value={state.buyQty} min={1} max={item.stock} disabled={!checked} onChange={onQtyChange} />
      <div className={cn("text-right min-w-[80px]", !checked && "opacity-40")}>
        <p className="text-sm font-bold text-primary">{formatCurrency(total)}</p>
        <p className="text-[10px] text-muted-foreground">{formatCurrency(item.buyPrice)}/sp</p>
      </div>
    </div>
  );
}

function RentRow({
  item,
  state,
  checked,
  onCheck,
  onStartChange,
  onEndChange,
}: {
  item: CartItemView;
  state: ItemState;
  checked: boolean;
  onCheck: (v: boolean) => void;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
}) {
  const days = rentDays(state.rentStart, state.rentEnd);
  const total = calcRentTotal(item, state.rentStart, state.rentEnd, state.rentQty);
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors",
        checked ? "bg-secondary/5 dark:bg-secondary/10" : "bg-muted/40 dark:bg-muted/20",
      )}
    >
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
        {checked && (
          <div className="mt-1">
            <StatusBadge status={state.rentStatus} msg={state.rentMsg} />
          </div>
        )}
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

export function CartItemCard({
  item,
  state,
  selection,
  onToggle,
  onStateChange,
  onRemove,
  onQtyPersist,
}: {
  item: CartItemView;
  state: ItemState;
  selection: Set<ModeKey>;
  onToggle: (key: ModeKey, v: boolean) => void;
  onStateChange: (id: string, patch: Partial<ItemState>) => void;
  onRemove: (id: string) => void;
  onQtyPersist?: (id: string, quantity: number) => void;
}) {
  const isBuy = item.type === "buy";
  const isRent = item.type === "rent";
  const buyKey: ModeKey = `${item.cartItemId}:buy`;
  const rentKey: ModeKey = `${item.cartItemId}:rent`;

  const handleQtyChange = useCallback(
    async (qty: number) => {
      onStateChange(item.cartItemId, { buyQty: qty, buyStatus: "checking", buyMsg: "" });
      try {
        const result = await fetchListingVariantAvailability(item.listingVariantId, "BUY", { quantity: qty });
        const cap =
          result.tracked && result.availableQuantity != null
            ? Math.min(item.stock, result.availableQuantity)
            : item.stock;
        if (qty > cap) {
          onStateChange(item.cartItemId, { buyStatus: "error", buyMsg: `Chỉ còn ${cap} sp` });
          return;
        }
        onStateChange(item.cartItemId, { buyStatus: "ok", buyMsg: "" });
        onQtyPersist?.(item.cartItemId, qty);
      } catch {
        onStateChange(item.cartItemId, { buyStatus: "error", buyMsg: "Không kiểm tra được kho." });
      }
    },
    [item.cartItemId, item.listingVariantId, item.stock, onQtyPersist, onStateChange],
  );

  const handleRentDate = useCallback(
    async (start: string, end: string) => {
      onStateChange(item.cartItemId, { rentStart: start, rentEnd: end, rentStatus: "idle", rentMsg: "" });
      if (!start || !end) return;
      const d = rentDays(start, end);
      if (d <= 0) {
        onStateChange(item.cartItemId, { rentStatus: "error", rentMsg: "Ngày kết thúc phải sau ngày bắt đầu." });
        return;
      }
      onStateChange(item.cartItemId, { rentStatus: "checking", rentMsg: "" });
      try {
        const from = new Date(`${start}T00:00:00`).toISOString();
        const to = new Date(`${end}T23:59:59`).toISOString();
        const result = await fetchListingVariantAvailabilityInRange(item.listingVariantId, {
          from,
          to,
          mode: "RENT",
          quantity: state.rentQty,
        });
        const avail = result.availableQuantity ?? 0;
        if (result.tracked && avail < state.rentQty) {
          onStateChange(
            item.cartItemId,
            avail <= 0
              ? { rentStatus: "error", rentMsg: "Không còn hàng trong khung thời gian này." }
              : { rentStatus: "error", rentMsg: `Chỉ còn ${avail} sp trong khung thời gian này.` },
          );
          return;
        }
        onStateChange(item.cartItemId, { rentStatus: "ok", rentMsg: "" });
      } catch {
        onStateChange(item.cartItemId, { rentStatus: "error", rentMsg: "Không kiểm tra được lịch thuê." });
      }
    },
    [item.cartItemId, item.listingVariantId, state.rentQty, onStateChange],
  );

  const thumb =
    item.images[0] ??
    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=480&h=480&fit=crop";

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden dark:shadow-black/20">
      <div className="flex items-center gap-4 p-4 border-b border-border bg-muted/30 dark:bg-muted/15">
        <img src={thumb} alt={item.name} className="w-14 h-14 rounded-xl object-cover border border-border flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <Link href={`/listing/${encodeURIComponent(item.listingId)}`}>
            <h3 className="font-bold text-sm line-clamp-1 text-foreground hover:text-primary transition-colors">{item.name}</h3>
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5">{item.facilityId || "Cửa hàng"}</p>
          <div className="flex gap-1.5 mt-1.5">
            {isBuy && (
              <Badge className="text-[9px] px-1.5 py-0 bg-primary/10 text-primary border-0 font-semibold dark:bg-primary/15">Mua</Badge>
            )}
            {isRent && (
              <Badge className="text-[9px] px-1.5 py-0 bg-secondary/10 text-secondary border-0 font-semibold dark:bg-secondary/15">Thuê</Badge>
            )}
          </div>
        </div>
        <button
          type="button"
          className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-lg hover:bg-destructive/10 flex-shrink-0"
          onClick={() => onRemove(item.cartItemId)}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 space-y-2">
        {isBuy && (
          <BuyRow
            item={item}
            state={state}
            checked={selection.has(buyKey)}
            onCheck={(v) => onToggle(buyKey, !!v)}
            onQtyChange={handleQtyChange}
          />
        )}
        {isRent && (
          <RentRow
            item={item}
            state={state}
            checked={selection.has(rentKey)}
            onCheck={(v) => onToggle(rentKey, !!v)}
            onStartChange={(s) => handleRentDate(s, state.rentEnd)}
            onEndChange={(e) => handleRentDate(state.rentStart, e)}
          />
        )}
      </div>
    </div>
  );
}
