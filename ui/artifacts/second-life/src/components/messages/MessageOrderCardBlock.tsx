import { Link } from "wouter";
import { ShoppingBag } from "lucide-react";

import type { MessageOrderCard } from "@/api/conversations";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=480&h=480&fit=crop";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  SHIPPED: "Đang giao",
  DELIVERED: "Đã giao",
  RETURNED: "Đã trả",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

type Props = {
  card: MessageOrderCard;
  className?: string;
};

function orderHref(card: MessageOrderCard): string {
  const tab = card.status?.trim().toUpperCase();
  if (tab && tab !== "ALL") {
    return `/orders?tab=${encodeURIComponent(tab)}`;
  }
  return "/orders";
}

export function MessageOrderCardBlock({ card, className }: Props) {
  const thumb = card.thumbnailUrl?.trim() || PLACEHOLDER;
  const status = card.status?.trim().toUpperCase();
  const statusLabel = status ? STATUS_LABELS[status] ?? status : null;

  return (
    <Link href={orderHref(card)}>
      <a
        className={cn(
          "flex gap-3 rounded-xl border bg-background/90 p-2.5 text-left transition-colors hover:bg-muted/40",
          className,
        )}
      >
        <img
          src={thumb}
          alt={card.title}
          className="h-16 w-16 shrink-0 rounded-lg object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-secondary-foreground">
            <ShoppingBag className="h-3 w-3" />
            {card.orderType === "RENT" ? "Đơn thuê" : "Đơn mua"}
          </div>
          <p className="line-clamp-2 text-sm font-semibold leading-snug">{card.title}</p>
          {statusLabel ? (
            <p className="mt-1 text-xs text-muted-foreground">Trạng thái: {statusLabel}</p>
          ) : null}
          {card.amount != null && Number.isFinite(card.amount) ? (
            <p className="mt-1 text-sm font-bold text-primary">{formatCurrency(card.amount)}</p>
          ) : null}
          <p className="mt-1 text-[11px] text-muted-foreground">Xem đơn hàng</p>
        </div>
      </a>
    </Link>
  );
}
