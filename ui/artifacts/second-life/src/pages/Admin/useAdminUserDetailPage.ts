import { useQuery } from "@tanstack/react-query";
import {
  adminGetAccount,
  adminGetAccountActivitySummary,
  adminListBuyOrders,
  adminListListingsByOwner,
  adminListProductsByOwner,
  adminListRentOrders,
} from "@/api/admin";
import { searchAllFacilities } from "@/api/facility";
import type { ListingStatus } from "@/api/listing";
import type { ProductStatus } from "@/api/product";
import type { BookingOrderStatus } from "@/api/booking";
import type { RentalOrderStatus } from "@/api/rental";

export function useAdminUserAccount(accountId: string) {
  return useQuery({
    queryKey: ["admin", "user", accountId, "account"],
    queryFn: () => adminGetAccount(accountId),
    enabled: Boolean(accountId?.trim()),
  });
}

export function useAdminUserActivitySummary(accountId: string) {
  return useQuery({
    queryKey: ["admin", "user", accountId, "activity-summary"],
    queryFn: () => adminGetAccountActivitySummary(accountId),
    enabled: Boolean(accountId?.trim()),
    staleTime: 60_000,
  });
}

export function useAdminUserFacilities(
  profileId: string | null | undefined,
  page: number,
  pageSize: number,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["admin", "user", profileId, "facilities", page, pageSize],
    queryFn: () =>
      searchAllFacilities({
        ownerId: profileId ?? undefined,
        page,
        pageSize,
      }),
    enabled: enabled && Boolean(profileId?.trim()),
    staleTime: 60_000,
  });
}

export function useAdminUserProducts(
  profileId: string | null | undefined,
  page: number,
  pageSize: number,
  status: "ALL" | ProductStatus,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["admin", "user", profileId, "products", page, pageSize, status],
    queryFn: () =>
      adminListProductsByOwner({
        ownerId: profileId!.trim(),
        page,
        pageSize,
        status: status === "ALL" ? undefined : status,
      }),
    enabled: enabled && Boolean(profileId?.trim()),
    staleTime: 60_000,
  });
}

export function useAdminUserListings(
  profileId: string | null | undefined,
  page: number,
  pageSize: number,
  listingStatus: "ALL" | ListingStatus,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["admin", "user", profileId, "listings", page, pageSize, listingStatus],
    queryFn: () =>
      adminListListingsByOwner({
        ownerId: profileId!.trim(),
        page,
        pageSize,
        listingStatus: listingStatus === "ALL" ? undefined : listingStatus,
      }),
    enabled: enabled && Boolean(profileId?.trim()),
    staleTime: 60_000,
  });
}

export type AdminUserOrderScope = "buyer-buy" | "buyer-rent" | "seller-buy" | "seller-rent";

export function useAdminUserOrders(
  profileId: string | null | undefined,
  scope: AdminUserOrderScope,
  page: number,
  pageSize: number,
  status: string,
  enabled: boolean,
) {
  const isBuy = scope === "buyer-buy" || scope === "seller-buy";
  const isBuyer = scope.startsWith("buyer-");

  return useQuery({
    queryKey: ["admin", "user", profileId, "orders", scope, page, pageSize, status],
    queryFn: async () => {
      const params = {
        page,
        pageSize,
        status:
          status === "ALL"
            ? undefined
            : ((isBuy ? status : status) as BookingOrderStatus | RentalOrderStatus),
        buyerProfileId: isBuyer ? profileId ?? undefined : undefined,
        sellerProfileId: isBuyer ? undefined : profileId ?? undefined,
      };
      return isBuy ? adminListBuyOrders(params) : adminListRentOrders(params);
    },
    enabled: enabled && Boolean(profileId?.trim()),
    staleTime: 60_000,
  });
}
