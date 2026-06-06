import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Eye, MapPin, MessageSquare, Package, ShieldCheck, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FacilityMapEmbed } from "@/components/FacilityMapEmbed";
import { facilityAvatarUrl } from "@/api/facility";
import type { FacilityOverviewDto } from "@/api/listing";
import { useAuth } from "@/context/AuthContext";
import { formatFacilityAddress, resolveFacilityPlaceNames } from "@/lib/facility-display";
import { facilityHasMap } from "@/lib/google-maps";
import { cn } from "@/lib/utils";
import { buildMessagesHref } from "@/lib/message-navigation";

export type ListingChatContext = {
  listingId: string;
  listingVariantId?: string | null;
  title: string;
  thumbnailUrl?: string | null;
  listingType?: string | null;
  price?: number | null;
};

type Props = {
  facility: FacilityOverviewDto;
  listingContext?: ListingChatContext | null;
  className?: string;
  hideChat?: boolean;
};

export function ListingFacilitySection({ facility, listingContext, className, hideChat }: Props) {
  const { user, isAdmin } = useAuth();
  const provinceCode = facility.provinceCode?.trim() ?? "";
  const wardCode = facility.wardCode?.trim() ?? "";

  const isOwnFacility = Boolean(
    user?.id?.trim() &&
      facility.ownerId?.trim() &&
      user.id.trim() === facility.ownerId.trim(),
  );

  const { data: places } = useQuery({
    queryKey: ["listingFacilityPlace", provinceCode, wardCode] as const,
    queryFn: () => resolveFacilityPlaceNames(provinceCode, wardCode),
    enabled: Boolean(provinceCode),
    staleTime: 300_000,
  });

  const fullAddress = formatFacilityAddress({
    address: facility.address,
    wardName: places?.wardName,
    provinceName: places?.provinceName,
    wardCode: facility.wardCode,
    provinceCode: facility.provinceCode,
  });

  const chatHref = (() => {
    if (!facility.id) return "/messages";
    if (isOwnFacility) {
      return buildMessagesHref({ facilityId: facility.id, tab: "customers" });
    }
    if (listingContext) {
      return buildMessagesHref({
        facilityId: facility.id,
        listingId: listingContext.listingId,
        listingVariantId: listingContext.listingVariantId ?? undefined,
        productTitle: listingContext.title,
        thumbnailUrl: listingContext.thumbnailUrl ?? undefined,
        listingType: listingContext.listingType ?? undefined,
        price: listingContext.price ?? undefined,
      });
    }
    return buildMessagesHref({ facilityId: facility.id });
  })();

  const mapFacility = {
    linkGoogleMap: facility.linkGoogleMap ?? "",
    latitude: null,
    longitude: null,
    address: facility.address ?? "",
    searchAddress: fullAddress,
  };
  const showMap = facilityHasMap(mapFacility);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-card via-card to-muted/20 shadow-sm ring-1 ring-border/35 dark:from-card dark:via-card dark:to-muted/10 dark:shadow-xl dark:shadow-black/20 dark:ring-border/25",
        className,
      )}
    >
      <div className="p-6 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <div className="flex min-w-0 flex-1 gap-4">
            <div className="relative shrink-0">
              <img
                src={facilityAvatarUrl({ imageUrl: facility.imageUrl ?? undefined })}
                alt={facility.name ?? ""}
                className="h-16 w-16 rounded-full border-2 border-primary/25 object-cover shadow-md ring-2 ring-background sm:h-20 sm:w-20 dark:border-primary/35 dark:ring-border/50"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-lg font-bold text-foreground">
                <span>{facility.name ?? "Cơ sở"}</span>
                {facility.orderCount != null && facility.orderCount > 50 ? (
                  <ShieldCheck className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                ) : null}
              </div>
              {fullAddress ? (
                <div className="mt-2.5 flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 opacity-80" />
                  <span>{fullAddress}</span>
                </div>
              ) : null}
              <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 border-t border-border/60 pt-4 text-sm text-muted-foreground dark:border-border/50">
                <div className="flex items-center gap-1.5">
                  <Package className="h-4 w-4 opacity-80" />
                  <span>
                    <strong className="tabular-nums text-foreground">{facility.orderCount ?? 0}</strong> đơn đã bán / cho thuê
                  </span>
                </div>
                <span className="hidden text-muted-foreground/40 sm:inline" aria-hidden>
                  •
                </span>
                <div className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4 opacity-80" />
                  <span>
                    <strong className="tabular-nums text-foreground">{facility.viewCount ?? 0}</strong> lượt xem
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {!hideChat && !isAdmin ? (
                  <Link href={chatHref}>
                    <Button
                      variant="outline"
                      size="default"
                      className="cursor-pointer rounded-full border-border/80 transition-all hover:bg-muted/60 active:scale-[0.99] dark:hover:bg-muted/30"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {isOwnFacility ? "Tin nhắn khách" : "Chat ngay"}
                    </Button>
                  </Link>
                ) : null}
                {facility.id ? (
                  <Link href={`/facility/${encodeURIComponent(facility.id)}`}>
                    <Button
                      size="default"
                      className="cursor-pointer rounded-full border-0 bg-primary/12 text-primary shadow-none transition-all hover:bg-primary/20 active:scale-[0.99] dark:bg-primary/18 dark:hover:bg-primary/28"
                    >
                      <Store className="mr-2 h-4 w-4" /> Xem cơ sở
                    </Button>
                  </Link>
                ) : null}
              </div>
            </div>
          </div>

          {showMap ? (
            <FacilityMapEmbed facility={mapFacility} className="w-full shrink-0 lg:w-72 xl:w-80" />
          ) : null}
        </div>
      </div>
    </div>
  );
}
