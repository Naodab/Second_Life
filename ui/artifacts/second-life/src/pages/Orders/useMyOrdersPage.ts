import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { format, parseISO, isValid } from "date-fns";
import { vi } from "date-fns/locale";

import { listBookingOrders, type BookingOrderStatus } from "@/api/booking";
import { listRentalOrders, type RentalOrderStatus } from "@/api/rental";
import { fetchListingVariantContext, type ListingVariantContextResponse } from "@/api/listing";
import { useAuth } from "@/context/AuthContext";
import { mapApiError, type ApiErrorViewModel } from "@/lib/api-error";
import {
  bookingToEnriched,
  mergeOrdersNewestFirst,
  orderMatchesTab,
  rentalToEnriched,
  type EnrichedOrder,
  type OrderDisplayStatus,
  type OrderKind,
} from "./unified-orders";

export type { EnrichedOrder, OrderKind };

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=480&h=480&fit=crop";

export type OrderTab = "all" | OrderDisplayStatus;

export const ORDER_STATUS_LABELS: Record<OrderDisplayStatus, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  SHIPPED: "Đang giao",
  DELIVERED: "Đã giao",
  RETURNED: "Đã trả",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

export const ORDER_TABS: { value: OrderTab; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "PENDING", label: ORDER_STATUS_LABELS.PENDING },
  { value: "CONFIRMED", label: ORDER_STATUS_LABELS.CONFIRMED },
  { value: "SHIPPED", label: ORDER_STATUS_LABELS.SHIPPED },
  { value: "DELIVERED", label: ORDER_STATUS_LABELS.DELIVERED },
  { value: "RETURNED", label: ORDER_STATUS_LABELS.RETURNED },
  { value: "COMPLETED", label: ORDER_STATUS_LABELS.COMPLETED },
  { value: "CANCELLED", label: ORDER_STATUS_LABELS.CANCELLED },
];

export function parseOrderTabFromSearch(search: string): OrderTab {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const tab = new URLSearchParams(raw).get("tab")?.trim().toUpperCase();
  if (tab && ORDER_TABS.some((entry) => entry.value === tab)) {
    return tab as OrderTab;
  }
  return "all";
}

export function buildOrdersPath(tab: OrderTab = "all"): string {
  if (tab === "all") return "/orders";
  return `/orders?tab=${encodeURIComponent(tab)}`;
}

export function orderStatusBadgeClass(status: OrderDisplayStatus): string {
  switch (status) {
    case "COMPLETED":
    case "DELIVERED":
      return "bg-primary/10 text-primary border-primary/20";
    case "RETURNED":
      return "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800";
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
  return formatOrderDate(value);
}

export function formatRentalPeriod(order: EnrichedOrder): string {
  if (order.kind !== "rent") return "—";
  const start = formatOrderDate(order.startTime);
  const end = formatOrderDate(order.endTime);
  if (start === "—" && end === "—") return "—";
  return `${start} → ${end}`;
}

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
  if (order.kind === "buy" && order.price != null && Number.isFinite(order.price)) {
    return order.price;
  }
  const ctx = order.context;
  if (!ctx) return null;
  if (order.kind === "rent") {
    return ctx.rentPrice != null && Number.isFinite(ctx.rentPrice) ? ctx.rentPrice : null;
  }
  return ctx.buyPrice != null && Number.isFinite(ctx.buyPrice) ? ctx.buyPrice : null;
}

export function orderLineTotal(order: EnrichedOrder): number | null {
  if (order.kind === "rent" && order.price != null && Number.isFinite(order.price)) {
    return order.price;
  }
  const unit = orderUnitPrice(order);
  if (unit == null) return null;
  return unit * order.quantity;
}

export function canCancelOrder(order: EnrichedOrder): boolean {
  return order.status === "PENDING";
}

async function fetchMyOrders() {
  const [bookingOrders, rentalOrders] = await Promise.all([listBookingOrders(), listRentalOrders()]);
  return mergeOrdersNewestFirst([
    ...bookingOrders.map(bookingToEnriched),
    ...rentalOrders.map(rentalToEnriched),
  ]);
}

export function useMyOrdersPage(activeTab: OrderTab) {
  const { isLoggedIn, isLoading: authLoading } = useAuth();

  const ordersQuery = useQuery({
    queryKey: ["myOrders"] as const,
    queryFn: fetchMyOrders,
    enabled: isLoggedIn && !authLoading,
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

  const enrichedOrders: EnrichedOrder[] = useMemo(
    () =>
      baseOrders.map((order) => ({
        ...order,
        context: contextByVariantId.get(order.listingVariantId),
      })),
    [baseOrders, contextByVariantId],
  );

  const filteredOrders = useMemo(
    () => enrichedOrders.filter((order) => orderMatchesTab(order, activeTab)),
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

export type { BookingOrderStatus, RentalOrderStatus };
