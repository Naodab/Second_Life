import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";

import {
  listFacilityBookingOrders,
  type BookingOrderResponse,
  type BookingOrderStatus,
} from "@/api/booking";
import { fetchListingVariantContext, type ListingVariantContextResponse } from "@/api/listing";
import { useAuth } from "@/context/AuthContext";
import { mapApiError, type ApiErrorViewModel } from "@/lib/api-error";

export {
  ORDER_STATUS_LABELS,
  ORDER_TABS,
  orderStatusBadgeClass,
  formatOrderDate,
  formatPickupTime,
  orderDisplayTitle,
  orderThumbnail,
  orderUnitPrice,
  type EnrichedOrder,
} from "@/pages/Orders/useMyOrdersPage";

export type FacilityOrderTab = BookingOrderStatus;

export const ALL_FACILITIES_FILTER = "__all__";

export const FACILITY_ORDER_TABS: { value: FacilityOrderTab; label: string }[] = [
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "SHIPPED", label: "Đang giao" },
  { value: "DELIVERED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
];

export function sellerOrdersQueryKey(facilityFilter: string) {
  return ["sellerBookingOrders", facilityFilter] as const;
}

/** @deprecated use sellerOrdersQueryKey */
export function facilityOrdersQueryKey(facilityId: string) {
  return sellerOrdersQueryKey(facilityId);
}

function parseCreatedAt(value?: string | null): number {
  if (!value?.trim()) return 0;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}

export function sortOrdersByCreatedAtAsc<T extends { createdAt?: string | null }>(orders: T[]): T[] {
  return [...orders].sort((a, b) => parseCreatedAt(a.createdAt) - parseCreatedAt(b.createdAt));
}

async function fetchOrdersForFacilities(facilityIds: string[]): Promise<BookingOrderResponse[]> {
  if (facilityIds.length === 0) return [];
  const batches = await Promise.all(facilityIds.map((id) => listFacilityBookingOrders(id)));
  const byId = new Map<string, BookingOrderResponse>();
  for (const batch of batches) {
    for (const order of batch) {
      byId.set(order.id, order);
    }
  }
  return sortOrdersByCreatedAtAsc([...byId.values()]);
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

  const orders = ordersQuery.data ?? [];

  const variantIds = useMemo(
    () => [...new Set(orders.map((o) => o.listingVariantId).filter(Boolean))],
    [orders],
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
      sortOrdersByCreatedAtAsc(
        orders.map((order: BookingOrderResponse) => ({
          ...order,
          context: contextByVariantId.get(order.listingVariantId),
        })),
      ),
    [orders, contextByVariantId],
  );

  const filteredOrders = useMemo(
    () =>
      sortOrdersByCreatedAtAsc(enrichedOrders.filter((order) => order.status === activeTab)),
    [activeTab, enrichedOrders],
  );

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
    queryFn: () => listFacilityBookingOrders(facilityId),
    enabled: isLoggedIn && !authLoading && Boolean(facilityId?.trim()),
    staleTime: 30_000,
  });

  return query.data?.length ?? 0;
}

/** @deprecated use useManageOrdersPage */
export function useFacilityOrdersPage(facilityId: string, activeTab: FacilityOrderTab) {
  return useManageOrdersPage([{ id: facilityId, name: "" }], facilityId, activeTab);
}
