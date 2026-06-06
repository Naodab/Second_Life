import { Link } from "wouter";
import { Package } from "lucide-react";

import type { MessageProductCard } from "@/api/conversations";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=480&h=480&fit=crop";

type Props = {
  card: MessageProductCard;
  className?: string;
};

function listingTypeLabel(value?: string | null): string {
  switch (value?.toUpperCase()) {
    case "BUY":
      return "Mua";
    case "RENT":
      return "Thuê";
    case "BOTH":
      return "Mua / Thuê";
    default:
      return "Sản phẩm";
  }
}

export function MessageProductCardBlock({ card, className }: Props) {
  const href = `/listing/${encodeURIComponent(card.listingId)}`;
  const thumb = card.thumbnailUrl?.trim() || PLACEHOLDER;

  return (
    <Link href={href}>
      <a
        className={cn(
          "flex cursor-pointer gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-muted/50",
          className ?? "border-border bg-card",
        )}
      >
        <img
          src={thumb}
          alt={card.title}
          className="h-20 w-20 shrink-0 rounded-lg object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            <Package className="h-3 w-3" />
            {listingTypeLabel(card.listingType)}
          </div>
          <p className="line-clamp-2 text-sm font-semibold leading-snug">{card.title}</p>
          {card.price != null && Number.isFinite(card.price) ? (
            <p className="mt-1 text-sm font-bold text-primary">{formatCurrency(card.price)}</p>
          ) : null}
          <p className="mt-1 text-[11px] text-muted-foreground">Xem chi tiết sản phẩm</p>
        </div>
      </a>
    </Link>
  );
}
