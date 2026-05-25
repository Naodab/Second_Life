import { Store, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { facilityAvatarUrl, DEFAULT_FACILITY_AVATAR } from "@/api/facility";
import type { CheckoutLineItem } from "@/checkout/build-checkout-line";
import { facilityDisplayName } from "./checkout-utils";

type Props = {
  item: CheckoutLineItem;
  subOrderIndex?: number;
  showSubOrderBadge?: boolean;
  ownerLoading?: boolean;
};

function ownerAvatarUrl(avatarUrl: string | null | undefined): string {
  return avatarUrl?.trim() || DEFAULT_FACILITY_AVATAR;
}

export function CheckoutFacilityHeader({
  item,
  subOrderIndex,
  showSubOrderBadge,
  ownerLoading,
}: Props) {
  const facilityName = facilityDisplayName(item);
  const ownerName = item.facilityOwnerName?.trim();
  const showOwner = Boolean(item.facilityOwnerId?.trim());

  return (
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <img
        src={facilityAvatarUrl({ imageUrl: item.facilityImageUrl || undefined })}
        alt={facilityName}
        className="w-11 h-11 rounded-xl object-cover border border-border flex-shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-bold text-sm text-foreground truncate">{facilityName}</p>
          {showSubOrderBadge && subOrderIndex != null ? (
            <Badge
              variant="outline"
              className="text-[10px] px-2 py-0 font-medium text-primary border-primary/30 dark:border-primary/50 dark:bg-primary/10"
            >
              Đơn #{subOrderIndex + 1}
            </Badge>
          ) : null}
        </div>
        {showOwner ? (
          <div className="mt-1 flex items-center gap-2 min-w-0">
            {ownerLoading ? (
              <span className="text-xs text-muted-foreground">Đang tải chủ cửa hàng…</span>
            ) : ownerName ? (
              <>
                <img
                  src={ownerAvatarUrl(item.facilityOwnerAvatarUrl)}
                  alt={ownerName}
                  className="w-5 h-5 rounded-full object-cover border border-border flex-shrink-0"
                />
                <span className="text-xs text-muted-foreground truncate">
                  Chủ cửa hàng: <span className="font-medium text-foreground">{ownerName}</span>
                </span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="w-3.5 h-3.5 flex-shrink-0" />
                Chủ cửa hàng
              </span>
            )}
          </div>
        ) : (
          <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
            <Store className="w-3 h-3 flex-shrink-0" />
            Cơ sở bán hàng
          </p>
        )}
      </div>
    </div>
  );
}
