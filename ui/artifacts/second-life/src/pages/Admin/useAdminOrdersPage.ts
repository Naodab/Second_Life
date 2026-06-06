import { useQuery } from "@tanstack/react-query";
import { adminListBuyOrders, adminListRentOrders } from "@/api/admin";
import type { BookingOrderStatus } from "@/api/booking";
import type { RentalOrderStatus } from "@/api/rental";

export type AdminOrderKind = "buy" | "rent";

export function useAdminOrdersPage(
  kind: AdminOrderKind,
  page: number,
  pageSize: number,
  status: string,
) {
  const buyQuery = useQuery({
    queryKey: ["admin", "orders", "buy", page, pageSize, status],
    queryFn: () =>
      adminListBuyOrders({
        page,
        pageSize,
        status: status === "ALL" ? undefined : (status as BookingOrderStatus),
      }),
    enabled: kind === "buy",
  });

  const rentQuery = useQuery({
    queryKey: ["admin", "orders", "rent", page, pageSize, status],
    queryFn: () =>
      adminListRentOrders({
        page,
        pageSize,
        status: status === "ALL" ? undefined : (status as RentalOrderStatus),
      }),
    enabled: kind === "rent",
  });

  const active = kind === "buy" ? buyQuery : rentQuery;

  return {
    items: active.data?.items ?? [],
    totalCount: active.data?.totalCount ?? 0,
    isLoading: active.isLoading,
    isError: active.isError,
    error: active.error,
  };
}
