import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { format, parseISO, isValid } from "date-fns";
import { vi } from "date-fns/locale";

import { listBookingOrders, type BookingOrderResponse, type BookingOrderStatus } from "@/api/booking";
import { fetchListingVariantContext, type ListingVariantContextResponse } from "@/api/listing";
import { useAuth } from "@/context/AuthContext";
import { mapApiError, type ApiErrorViewModel } from "@/lib/api-error";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=480&h=480&fit=crop";

export type OrderTab = "all" | BookingOrderStatus;

export const ORDER_STATUS_LABELS: Record<BookingOrderStatus, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  SHIPPED: "Đang giao",
  DELIVERED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

export const ORDER_TABS: { value: OrderTab; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "PENDING", label: ORDER_STATUS_LABELS.PENDING },
  { value: "CONFIRMED", label: ORDER_STATUS_LABELS.CONFIRMED },
  { value: "SHIPPED", label: ORDER_STATUS_LABELS.SHIPPED },
  { value: "DELIVERED", label: ORDER_STATUS_LABELS.DELIVERED },
  { value: "CANCELLED", label: ORDER_STATUS_LABELS.CANCELLED },
];

export function orderStatusBadgeClass(status: BookingOrderStatus): string {
  switch (status) {
    case "DELIVERED":
      return "bg-primary/10 text-primary border-primary/20";
    case "SHIPPED":
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
    case "CONFIRMED":
      return "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800";
    case "CANCELLED":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
  }
}

export function formatOrderDate(value?: string | null): string {
  if (!value?.trim()) return "—";
  const parsed = parseISO(value);
  if (!isValid(parsed)) return value;
  return format(parsed, "dd/MM/yyyy HH:mm", { locale: vi });
}

export function formatPickupTime(value?: string | null): string {
  if (!value?.trim()) return "—";
  const parsed = parseISO(value);
  if (!isValid(parsed)) return value;
  return format(parsed, "dd/MM/yyyy HH:mm", { locale: vi });
}

export type EnrichedOrder = BookingOrderResponse & {
  context?: ListingVariantContextResponse;
};

export function orderDisplayTitle(order: EnrichedOrder): string {
  const ctx = order.context;
  if (!ctx) return `Phiên bản ${order.listingVariantId.slice(0, 8)}…`;
  const base = ctx.title?.trim() || ctx.productName?.trim() || "Sản phẩm";
  const label = ctx.variantLabel?.trim();
  return label ? `${base} (${label})` : base;
}

export function orderThumbnail(order: EnrichedOrder): string {
  return order.context?.thumbnailUrl?.trim() || PLACEHOLDER_IMAGE;
}

export function orderListingHref(order: EnrichedOrder): string | null {
  const listingId = order.context?.listingId?.trim();
  if (!listingId) return null;
  return `/listing/${encodeURIComponent(listingId)}`;
}

export function orderUnitPrice(order: EnrichedOrder): number | null {
  if (order.price != null && Number.isFinite(order.price)) return order.price;
  const ctx = order.context;
  if (!ctx) return null;
  if (ctx.listingType === "RENT") {
    return ctx.rentPrice != null && Number.isFinite(ctx.rentPrice) ? ctx.rentPrice : null;
  }
  return ctx.buyPrice != null && Number.isFinite(ctx.buyPrice) ? ctx.buyPrice : null;
}

export function canCancelOrder(status: BookingOrderStatus): boolean {
  return status === "PENDING";
}

export function useMyOrdersPage(activeTab: OrderTab) {
  const { isLoggedIn, isLoading: authLoading } = useAuth();

  const ordersQuery = useQuery({
    queryKey: ["myBookingOrders"] as const,
    queryFn: listBookingOrders,
    enabled: isLoggedIn && !authLoading,
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

  const enrichedOrders: EnrichedOrder[] = useMemo(
    () =>
      orders.map((order) => ({
        ...order,
        context: contextByVariantId.get(order.listingVariantId),
      })),
    [orders, contextByVariantId],
  );

  const filteredOrders = useMemo(
    () =>
      activeTab === "all"
        ? enrichedOrders
        : enrichedOrders.filter((order) => order.status === activeTab),
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
