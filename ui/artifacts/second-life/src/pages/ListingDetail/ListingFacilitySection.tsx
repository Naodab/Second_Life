import { Link } from "wouter";
import { Clock, MapPin, MessageSquare, Package, ShieldCheck, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { facilityAvatarUrl } from "@/api/facility";
import type { ListingPublicDetailResponse } from "@/api/listing";

type Facility = NonNullable<ListingPublicDetailResponse["product"]["facility"]>;

type Props = {
  facility: Facility;
};

/** Chỉ mount khi `facility.id` đã có — block hiển thị hồ sơ cơ sở. */
export function ListingFacilitySection({ facility }: Props) {
  return (
    <div className="mt-10 overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-card via-card to-muted/20 shadow-sm ring-1 ring-border/35 dark:from-card dark:via-card dark:to-muted/10 dark:shadow-xl dark:shadow-black/20 dark:ring-border/25">
      <div className="p-6 sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
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
              {facility.address || facility.wardCode || facility.provinceCode ? (
                <div className="mt-2.5 flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 opacity-80" />
                  <span>{[facility.address, facility.wardCode, facility.provinceCode].filter(Boolean).join(", ")}</span>
                </div>
              ) : null}
              <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 border-t border-border/60 pt-4 text-sm text-muted-foreground dark:border-border/50">
                <div className="flex items-center gap-1.5">
                  <Package className="h-4 w-4 opacity-80" />
                  <span>
                    <strong className="tabular-nums text-foreground">{facility.orderCount ?? 0}</strong> đơn đã hoàn thành (ước tính)
                  </span>
                </div>
                <span className="hidden text-muted-foreground/40 sm:inline" aria-hidden>
                  •
                </span>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 opacity-80" />
                  <span>Luôn cập nhật trên Second Life</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3 lg:items-start">
            <Link href="/messages">
              <Button variant="outline" size="default" className="rounded-full border-border/80 transition-all hover:bg-muted/60 active:scale-[0.99] dark:hover:bg-muted/30">
                <MessageSquare className="mr-2 h-4 w-4" /> Chat ngay
              </Button>
            </Link>
            <Link href={`/facility/${encodeURIComponent(facility.id)}`}>
              <Button className="rounded-full border-0 bg-primary/12 text-primary shadow-none transition-all hover:bg-primary/20 active:scale-[0.99] dark:bg-primary/18 dark:hover:bg-primary/28">
                <Store className="mr-2 h-4 w-4" /> Xem cơ sở
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
