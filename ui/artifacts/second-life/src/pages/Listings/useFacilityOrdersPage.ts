import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";

import { listFacilityBookingOrders } from "@/api/booking";
import { listFacilityRentalOrders } from "@/api/rental";
import { fetchListingVariantContext, type ListingVariantContextResponse } from "@/api/listing";
import { useAuth } from "@/context/AuthContext";
import { mapApiError, type ApiErrorViewModel } from "@/lib/api-error";
import {
  bookingToEnriched,
  mergeOrdersOldestFirst,
  rentalToEnriched,
  type EnrichedOrder,
  type OrderDisplayStatus,
} from "@/pages/Orders/unified-orders";

export {
  ORDER_STATUS_LABELS,
  ORDER_TABS,
  orderStatusBadgeClass,
  formatOrderDate,
  formatPickupTime,
  formatRentalPeriod,
  orderDisplayTitle,
  orderThumbnail,
  orderUnitPrice,
  orderLineTotal,
  type EnrichedOrder,
} from "@/pages/Orders/useMyOrdersPage";

export type FacilityOrderTab = OrderDisplayStatus;

export const ALL_FACILITIES_FILTER = "__all__";

export const FACILITY_ORDER_TABS: { value: FacilityOrderTab; label: string }[] = [
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "SHIPPED", label: "Đang giao" },
  { value: "DELIVERED", label: "Đã giao" },
  { value: "RETURNED", label: "Đã trả" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
];

export function sellerOrdersQueryKey(facilityFilter: string) {
  return ["sellerOrders", facilityFilter] as const;
}

export function facilityOrdersQueryKey(facilityId: string) {
  return sellerOrdersQueryKey(facilityId);
}

async function fetchOrdersForFacilities(facilityIds: string[]): Promise<EnrichedOrder[]> {
  if (facilityIds.length === 0) return [];
  const batches = await Promise.all(
    facilityIds.map(async (id) => {
      const [bookingOrders, rentalOrders] = await Promise.all([
        listFacilityBookingOrders(id),
        listFacilityRentalOrders(id),
      ]);
      return [
        ...bookingOrders.map(bookingToEnriched),
        ...rentalOrders.map(rentalToEnriched),
      ];
    }),
  );
  const byId = new Map<string, EnrichedOrder>();
  for (const batch of batches) {
    for (const order of batch) {
      byId.set(`${order.kind}:${order.id}`, order);
    }
  }
  return mergeOrdersOldestFirst([...byId.values()]);
}

export function useManageOrdersPage(
  facilities: { id: string; name: string }[],
  facilityFilter: string,
  activeTab: FacilityOrderTab,
) {
  const { isLoggedIn, isLoading: authLoading } = useAuth();

  const facilityIdsToFetch = useMemo(() => {
    if (facilityFilter === ALL_FACILITIES_FILTER) {
      return facilities.map((f) => f.id).filter(Boolean);
    }
    return facilityFilter.trim() ? [facilityFilter.trim()] : [];
  }, [facilities, facilityFilter]);

  const ordersQuery = useQuery({
    queryKey: sellerOrdersQueryKey(facilityFilter),
    queryFn: () => fetchOrdersForFacilities(facilityIdsToFetch),
    enabled: isLoggedIn && !authLoading && facilityIdsToFetch.length > 0,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const baseOrders = ordersQuery.data ?? [];

  const variantIds = useMemo(
    () => [...new Set(baseOrders.map((o) => o.listingVariantId).filter(Boolean))],
    [baseOrders],
  );

  const contextQueries = useQueries({
    queries: variantIds.map((variantId) => ({
      queryKey: ["listingVariantContext", variantId] as const,
      queryFn: () => fetchListingVariantContext(variantId),
      staleTime: 120_000,
      retry: 1,
    })),
  });

  const contextByVariantId = useMemo(() => {
    const map = new Map<string, ListingVariantContextResponse>();
    variantIds.forEach((id, index) => {
      const data = contextQueries[index]?.data;
      if (data) map.set(id, data);
    });
    return map;
  }, [variantIds, contextQueries]);

  const enrichedOrders = useMemo(
    () =>
      mergeOrdersOldestFirst(
        baseOrders.map((order) => ({
          ...order,
          context: contextByVariantId.get(order.listingVariantId),
        })),
      ),
    [baseOrders, contextByVariantId],
  );

  const filteredOrders = useMemo(() => {
    const matches = enrichedOrders.filter((order) => {
      if (activeTab === "SHIPPED") return order.kind === "buy" && order.status === "SHIPPED";
      return order.status === activeTab;
    });
    return mergeOrdersOldestFirst(matches);
  }, [activeTab, enrichedOrders]);

  const errorView: ApiErrorViewModel | null = useMemo(() => {
    if (!ordersQuery.error) return null;
    return mapApiError(ordersQuery.error, {
      fallbackTitle: "Không thể tải đơn hàng",
      fallbackMessage: "Đã xảy ra lỗi khi tải danh sách đơn hàng. Vui lòng thử lại.",
    });
  }, [ordersQuery.error]);

  const contextsLoading =
    variantIds.length > 0 && contextQueries.some((q) => q.isLoading && !q.data);

  return {
    orders: enrichedOrders,
    filteredOrders,
    isLoading: authLoading || ordersQuery.isLoading,
    contextsLoading,
    isError: Boolean(errorView),
    errorView,
    refetch: () => void ordersQuery.refetch(),
  };
}

export function useFacilityOrdersCount(facilityId: string) {
  const { isLoggedIn, isLoading: authLoading } = useAuth();

  const query = useQuery({
    queryKey: sellerOrdersQueryKey(facilityId),
    queryFn: async () => {
      const [bookingOrders, rentalOrders] = await Promise.all([
        listFacilityBookingOrders(facilityId),
        listFacilityRentalOrders(facilityId),
      ]);
      return bookingOrders.length + rentalOrders.length;
    },
    enabled: isLoggedIn && !authLoading && Boolean(facilityId?.trim()),
    staleTime: 30_000,
  });

  return query.data ?? 0;
}

export function useFacilityOrdersPage(facilityId: string, activeTab: FacilityOrderTab) {
  return useManageOrdersPage([{ id: facilityId, name: "" }], facilityId, activeTab);
}
