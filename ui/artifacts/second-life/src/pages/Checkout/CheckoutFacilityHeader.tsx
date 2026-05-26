import { Mail, MapPin, Phone, Store } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { facilityAvatarUrl } from "@/api/facility";
import type { CheckoutLineItem } from "@/checkout/build-checkout-line";
import { formatWardProvinceLine } from "@/lib/facility-display";
import { cn } from "@/lib/utils";
import { checkoutHighlightClass } from "./checkout-utils";
import { facilityDisplayName } from "./checkout-utils";

type SharedProps = {
  item: CheckoutLineItem;
  subOrderIndex?: number;
  showSubOrderBadge?: boolean;
  ownerNameLoading?: boolean;
  placeNamesLoading?: boolean;
};

function InfoRow({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  loading?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background/80 text-muted-foreground ring-1 ring-border/60 dark:bg-background/50">
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {loading ? (
          <p className="mt-1 text-sm text-muted-foreground animate-pulse">Đang tải…</p>
        ) : (
          <p className="mt-0.5 text-sm font-medium text-foreground break-words leading-snug">
            {value || "—"}
          </p>
        )}
      </div>
    </div>
  );
}

/** Hàng thu gọn trên header accordion (tên + tổng tiền). */
export function CheckoutFacilityCollapseHeader({
  item,
  subOrderIndex,
  showSubOrderBadge,
  ownerNameLoading,
}: Pick<SharedProps, "item" | "subOrderIndex" | "showSubOrderBadge" | "ownerNameLoading">) {
  const facilityName = facilityDisplayName(item);
  const ownerName = item.ownerDisplayName?.trim() ?? "";
  const hasFacility = Boolean(item.facilityId?.trim());

  if (!hasFacility) {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
          <Store className="h-5 w-5" />
        </span>
        <span className="text-sm font-medium text-muted-foreground">Cơ sở bán hàng</span>
      </div>
    );
  }

  const subtitle = ownerNameLoading
    ? "Đang tải…"
    : [ownerName, facilityName].filter(Boolean).join(" · ") || facilityName;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
      <img
        src={facilityAvatarUrl({ imageUrl: item.facilityImageUrl || undefined })}
        alt=""
        className="h-10 w-10 shrink-0 rounded-xl border border-border/80 object-cover shadow-sm"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">Thông tin chủ sản phẩm</span>
          {showSubOrderBadge && subOrderIndex != null ? (
            <Badge
              variant="outline"
              className="h-5 px-1.5 text-[10px] font-medium text-primary border-primary/25 bg-primary/5"
            >
              Đơn #{subOrderIndex + 1}
            </Badge>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

/** Card chi tiết — hiển thị khi mở rộng đơn theo cơ sở. */
export function CheckoutSellerInfoPanel({
  item,
  ownerNameLoading,
  placeNamesLoading,
}: Pick<SharedProps, "item" | "ownerNameLoading" | "placeNamesLoading">) {
  const facilityName = facilityDisplayName(item);
  const ownerName = item.ownerDisplayName?.trim() ?? "";
  const email = item.ownerEmail?.trim() ?? "";
  const phone = item.ownerPhone?.trim() ?? "";
  const streetAddress = item.facilityAddress?.trim() ?? "";
  const wardProvince = formatWardProvinceLine(item.facilityWardName, item.facilityProvinceName);

  if (!item.facilityId?.trim()) return null;

  return (
    <div className={cn(checkoutHighlightClass, "mx-5 mt-4 mb-1 rounded-2xl p-4 sm:p-5")}>
      <div className="mb-4 flex items-center gap-3 border-b border-border/50 pb-4 dark:border-border/40">
        <img
          src={facilityAvatarUrl({ imageUrl: item.facilityImageUrl || undefined })}
          alt=""
          className="h-14 w-14 shrink-0 rounded-2xl border-2 border-background object-cover shadow-md ring-1 ring-primary/15"
        />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Chủ sản phẩm</p>
          {ownerNameLoading ? (
            <p className="mt-1 text-base font-semibold text-muted-foreground animate-pulse">Đang tải…</p>
          ) : (
            <p className="mt-0.5 text-base font-semibold text-foreground leading-tight">
              {ownerName || "—"}
            </p>
          )}
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Store className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{facilityName}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 sm:gap-x-8">
        <InfoRow icon={Mail} label="Email" value={email} />
        <InfoRow icon={Phone} label="Số điện thoại" value={phone} />
        <InfoRow icon={Store} label="Cơ sở" value={facilityName} />
        <InfoRow icon={MapPin} label="Địa chỉ" value={streetAddress} />
        <div className="sm:col-span-2 border-t border-border/40 pt-3 mt-1 dark:border-border/30">
          <InfoRow
            icon={MapPin}
            label="Phường, thành phố"
            value={wardProvince}
            loading={placeNamesLoading}
          />
        </div>
      </div>
    </div>
  );
}
