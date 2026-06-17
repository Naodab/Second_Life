import { useEffect, useMemo, useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Star,
  ShieldCheck,
  MapPin,
  Store,
  MessageSquare,
  Package,
  Eye,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { buildMessagesHref } from "@/lib/message-navigation";
import { ListingCard } from "@/components/ListingCard";
import { ListingPaginationBar } from "@/components/ListingPaginationBar";
import { ApiErrorState } from "@/components/errors";
import { FacilityMapEmbed } from "@/components/FacilityMapEmbed";
import { Skeleton } from "@/components/ui/skeleton";
import { getFacilityById, facilityAvatarUrl } from "@/api/facility";
import { searchListings } from "@/api/listing";
import { formatFacilityAddress, resolveFacilityPlaceNames } from "@/lib/facility-display";
import { buildFacilityMapSource, facilityHasMap } from "@/lib/google-maps";
import { mapApiError } from "@/lib/api-error";
import { useAuth } from "@/context/AuthContext";

const PAGE_SIZE = 12;

export default function FacilityPage() {
  const { user, isAdmin } = useAuth();
  const [, facilityParams] = useRoute("/facility/:id");
  const [, legacyShopParams] = useRoute("/shop/:id");
  const facilityId = (facilityParams?.id ?? legacyShopParams?.id ?? "").trim();
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [facilityId]);

  const facilityQuery = useQuery({
    queryKey: ["publicFacility", facilityId],
    queryFn: () => getFacilityById(facilityId),
    enabled: Boolean(facilityId),
    retry: false,
  });

  const placesQuery = useQuery({
    queryKey: ["publicFacilityPlace", facilityQuery.data?.provinceCode, facilityQuery.data?.wardCode],
    queryFn: () =>
      resolveFacilityPlaceNames(facilityQuery.data!.provinceCode, facilityQuery.data!.wardCode),
    enabled: Boolean(facilityQuery.data?.provinceCode),
    staleTime: 300_000,
  });

  const listingsQuery = useQuery({
    queryKey: ["publicFacilityListings", facilityId, page],
    queryFn: () =>
      searchListings({
        facilityId,
        listingStatus: "ACTIVE",
        sortBy: "UPDATED_AT_DESC",
        page,
        pageSize: PAGE_SIZE,
      }),
    enabled: Boolean(facilityId) && facilityQuery.isSuccess,
    staleTime: 30_000,
  });

  const facilityErrorView = useMemo(() => {
    if (!facilityQuery.error) return null;
    return mapApiError(facilityQuery.error, {
      fallbackTitle: "Không tìm thấy cơ sở",
      fallbackMessage: "Cơ sở này không tồn tại hoặc đã bị xóa.",
    });
  }, [facilityQuery.error]);

  if (!facilityId) {
    return (
      <ApiErrorState
        kind="not_found"
        variant="fullscreen"
        title="Không tìm thấy cơ sở"
        message="Đường dẫn không hợp lệ."
        homeHref="/"
      />
    );
  }

  if (facilityQuery.isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse space-y-8">
        <Skeleton className="h-48 w-full rounded-3xl" />
        <Skeleton className="h-32 w-full rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="aspect-square rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (facilityQuery.isError && facilityErrorView) {
    return (
      <ApiErrorState
        variant="fullscreen"
        model={facilityErrorView}
        homeHref="/"
        onRetry={() => void facilityQuery.refetch()}
      />
    );
  }

  const facility = facilityQuery.data;
  if (!facility) {
    return (
      <ApiErrorState
        kind="not_found"
        variant="fullscreen"
        title="Không tìm thấy cơ sở"
        message="Cơ sở này không tồn tại hoặc đã bị xóa."
        homeHref="/"
      />
    );
  }

  const fullAddress = formatFacilityAddress({
    address: facility.address,
    wardName: placesQuery.data?.wardName,
    provinceName: placesQuery.data?.provinceName,
    wardCode: facility.wardCode,
    provinceCode: facility.provinceCode,
  });
  const listings = listingsQuery.data?.items ?? [];
  const totalCount = typeof listingsQuery.data?.totalCount === "number" ? listingsQuery.data.totalCount : 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const rating = facility.averageRating ?? 0;
  const orderCount = Number(facility.orderCount ?? 0);
  const viewCount = Number(facility.viewCount ?? 0);
  const isOwnFacility = Boolean(
    user?.id?.trim() &&
      facility.ownerId?.trim() &&
      user.id.trim() === facility.ownerId.trim(),
  );
  const chatHref = isOwnFacility
    ? buildMessagesHref({ facilityId: facility.id, tab: "customers" })
    : buildMessagesHref({ facilityId: facility.id });
  const showMap = facilityHasMap(buildFacilityMapSource(facility, fullAddress));

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/25 pb-20 dark:to-muted/15">
      <div className="relative h-44 border-b border-primary/10 bg-gradient-to-br from-primary/15 via-primary/8 to-transparent sm:h-56 dark:border-primary/15 dark:from-primary/20 dark:via-primary/10 dark:to-transparent">
        <div
          className="absolute inset-0 opacity-20 dark:opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, var(--primary) 0%, transparent 60%), radial-gradient(circle at 80% 20%, var(--secondary) 0%, transparent 60%)",
          }}
        />
        <div className="absolute -bottom-16 left-6 sm:left-10">
          <div className="rounded-3xl border border-border/70 bg-card p-2 shadow-lg dark:border-border/50 dark:bg-card/95 dark:shadow-black/30">
            <img
              src={facilityAvatarUrl(facility)}
              alt={facility.name}
              className="h-24 w-24 rounded-2xl object-cover sm:h-28 sm:w-28"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-3xl border border-border/70 bg-card p-6 shadow-sm ring-1 ring-border/35 dark:border-border/50 dark:bg-card/95 dark:shadow-xl dark:shadow-black/20 dark:ring-border/25">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <div className="min-w-0 flex-1">
              <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-foreground">
                {facility.name}
                {orderCount > 50 ? <ShieldCheck className="h-5 w-5 text-primary" aria-hidden /> : null}
              </h1>
              {fullAddress ? (
                <div className="mt-1 flex items-start gap-1 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden />
                  <span>{fullAddress}</span>
                </div>
              ) : null}
              {facility.description?.trim() ? (
                <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{facility.description.trim()}</p>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5 font-semibold text-amber-500 dark:text-amber-400">
                  <Star className="h-4 w-4 fill-current" aria-hidden />
                  <span>{rating}</span>
                </div>
                <span className="text-muted-foreground/40" aria-hidden>
                  •
                </span>
                <div className="flex items-center gap-1.5">
                  <Package className="h-4 w-4" aria-hidden />
                  <span>
                    <strong className="text-foreground">{orderCount}</strong> đơn đã bán / cho thuê
                  </span>
                </div>
                <span className="text-muted-foreground/40" aria-hidden>
                  •
                </span>
                <div className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4" aria-hidden />
                  <span>
                    <strong className="text-foreground">{viewCount}</strong> lượt xem
                  </span>
                </div>
              </div>

              {!isAdmin ? (
              <div className="mt-4">
                <Link href={chatHref}>
                  <Button
                    variant="outline"
                    className="rounded-full border-border/80 transition-all hover:bg-muted/60 dark:hover:bg-muted/30"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" aria-hidden />{" "}
                    {isOwnFacility ? "Tin nhắn khách" : "Chat ngay"}
                  </Button>
                </Link>
              </div>
              ) : null}
            </div>

            {showMap ? (
              <FacilityMapEmbed
                facility={buildFacilityMapSource(facility, fullAddress)}
                className="w-full shrink-0 lg:w-72 xl:w-80"
              />
            ) : null}
          </div>
        </div>

        <div>
          <h2 className="mb-5 flex items-center gap-2 font-display text-xl font-bold text-foreground">
            <Store className="h-5 w-5 text-primary" aria-hidden />
            Bài đăng tại cơ sở
            <Badge variant="outline" className="ml-2 font-normal text-muted-foreground">
              {totalCount}
            </Badge>
          </h2>

          {listingsQuery.isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-border/70 bg-card py-20 text-muted-foreground dark:border-border/50 dark:bg-card/95">
              <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
              <p className="text-sm">Đang tải bài đăng…</p>
            </div>
          ) : listingsQuery.isError ? (
            <ApiErrorState
              variant="embedded"
              error={listingsQuery.error}
              mapOptions={{
                fallbackTitle: "Không tải được bài đăng",
                fallbackMessage: "Vui lòng thử lại sau.",
              }}
              onRetry={() => void listingsQuery.refetch()}
            />
          ) : listings.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {listings.map((row) => (
                  <ListingCard key={row.id} row={row} />
                ))}
              </div>
              {totalCount > PAGE_SIZE ? (
                <ListingPaginationBar
                  currentPage={page}
                  totalPages={totalPages}
                  pageSize={PAGE_SIZE}
                  totalItems={totalCount}
                  itemLabel="bài đăng"
                  onPageChange={setPage}
                />
              ) : null}
            </>
          ) : (
            <div className="rounded-3xl border border-border/70 bg-card py-20 text-center dark:border-border/50 dark:bg-card/95">
              <Store className="mx-auto mb-3 h-12 w-12 text-muted-foreground opacity-50" aria-hidden />
              <h3 className="mb-2 text-xl font-bold text-foreground">Chưa có bài đăng nào</h3>
              <p className="text-muted-foreground">Cơ sở này chưa có bài đăng đang hoạt động.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
