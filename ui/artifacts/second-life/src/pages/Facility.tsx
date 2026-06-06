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
import { Skeleton } from "@/components/ui/skeleton";
import { getFacilityById, facilityAvatarUrl } from "@/api/facility";
import { searchListings } from "@/api/listing";
import { formatFacilityAddress, resolveFacilityPlaceNames } from "@/lib/facility-display";
import { mapApiError } from "@/lib/api-error";
import { useAuth } from "@/context/AuthContext";

const PAGE_SIZE = 12;

export default function FacilityPage() {
  const { user } = useAuth();
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

  return (
    <div className="min-h-screen bg-gray-50/30 pb-20">
      <div className="bg-gradient-to-br from-primary/15 via-primary/8 to-transparent h-44 sm:h-56 relative border-b border-primary/10">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, var(--primary) 0%, transparent 60%), radial-gradient(circle at 80% 20%, var(--secondary) 0%, transparent 60%)",
          }}
        />
        <div className="absolute -bottom-16 left-6 sm:left-10">
          <div className="bg-white p-2 rounded-3xl shadow-lg border">
            <img
              src={facilityAvatarUrl(facility)}
              alt={facility.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="bg-white rounded-3xl border shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-5">
            <div>
              <h1 className="text-2xl font-display font-bold flex items-center gap-2">
                {facility.name}
                {orderCount > 50 ? <ShieldCheck className="w-5 h-5 text-primary" aria-hidden /> : null}
              </h1>
              {fullAddress ? (
                <div className="flex items-start gap-1 text-sm text-muted-foreground mt-1">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden />
                  <span>{fullAddress}</span>
                </div>
              ) : null}
              {facility.description?.trim() ? (
                <p className="text-sm text-muted-foreground mt-3 max-w-2xl">{facility.description.trim()}</p>
              ) : null}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5 text-amber-500 font-semibold">
                  <Star className="w-4 h-4 fill-current" aria-hidden />
                  <span>{rating}</span>
                </div>
                <span className="text-gray-300" aria-hidden>
                  •
                </span>
                <div className="flex items-center gap-1.5">
                  <Package className="w-4 h-4" aria-hidden />
                  <span>
                    <strong className="text-foreground">{orderCount}</strong> đơn đã bán / cho thuê
                  </span>
                </div>
                <span className="text-gray-300" aria-hidden>
                  •
                </span>
                <div className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" aria-hidden />
                  <span>
                    <strong className="text-foreground">{viewCount}</strong> lượt xem
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 flex-shrink-0 mt-2 md:mt-0">
              <Link href={chatHref}>
                <Button variant="outline" className="rounded-full bg-white">
                  <MessageSquare className="w-4 h-4 mr-2" aria-hidden />{" "}
                  {isOwnFacility ? "Tin nhắn khách" : "Chat ngay"}
                </Button>
              </Link>
              <Button className="rounded-full shadow-md shadow-primary/20 px-6" disabled>
                Theo dõi
              </Button>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-display font-bold mb-5 flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" aria-hidden />
            Bài đăng tại cơ sở
            <Badge variant="outline" className="ml-2 text-muted-foreground font-normal">
              {totalCount}
            </Badge>
          </h2>

          {listingsQuery.isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border text-muted-foreground gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden />
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
            <div className="text-center py-20 bg-white rounded-3xl border">
              <Store className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" aria-hidden />
              <h3 className="text-xl font-bold text-foreground mb-2">Chưa có bài đăng nào</h3>
              <p className="text-muted-foreground">Cơ sở này chưa có bài đăng đang hoạt động.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
