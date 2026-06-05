import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { updateBookingOrderStatus, type BookingOrderStatus } from "@/api/booking";
import { updateRentalOrderStatus, type RentalOrderStatus } from "@/api/rental";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { mapApiError } from "@/lib/api-error";
import type { OrderDisplayStatus, OrderKind } from "@/pages/Orders/unified-orders";

import { sellerOrdersQueryKey } from "./useFacilityOrdersPage";

type SellerOrderAction = {
  label: string;
  status: OrderDisplayStatus;
  variant?: "default" | "outline" | "destructive";
  className?: string;
};

function buyActionsForStatus(status: BookingOrderStatus): SellerOrderAction[] {
  switch (status) {
    case "PENDING":
      return [
        {
          label: "Từ chối",
          status: "CANCELLED",
          variant: "outline",
          className: "text-destructive border-destructive/30",
        },
        { label: "Xác nhận đơn", status: "CONFIRMED" },
      ];
    case "CONFIRMED":
      return [{ label: "Đã giao hàng", status: "SHIPPED" }];
    case "SHIPPED":
      return [{ label: "Hoàn thành", status: "DELIVERED", className: "bg-green-600 hover:bg-green-700" }];
    default:
      return [];
  }
}

function rentActionsForStatus(status: RentalOrderStatus): SellerOrderAction[] {
  switch (status) {
    case "PENDING":
      return [
        {
          label: "Từ chối",
          status: "CANCELLED",
          variant: "outline",
          className: "text-destructive border-destructive/30",
        },
        { label: "Xác nhận đơn", status: "CONFIRMED" },
      ];
    case "CONFIRMED":
      return [{ label: "Đã giao", status: "DELIVERED" }];
    case "DELIVERED":
      return [{ label: "Đã nhận lại", status: "RETURNED" }];
    case "RETURNED":
      return [{ label: "Hoàn thành", status: "COMPLETED", className: "bg-green-600 hover:bg-green-700" }];
    default:
      return [];
  }
}

export function FacilityOrderActionButtons({
  facilityFilter,
  orderId,
  orderKind,
  status,
}: {
  facilityFilter: string;
  orderId: string;
  orderKind: OrderKind;
  status: OrderDisplayStatus;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const actions =
    orderKind === "rent"
      ? rentActionsForStatus(status as RentalOrderStatus)
      : buyActionsForStatus(status as BookingOrderStatus);

  const mutation = useMutation({
    mutationFn: async (nextStatus: OrderDisplayStatus): Promise<void> => {
      if (orderKind === "rent") {
        await updateRentalOrderStatus(orderId, nextStatus as RentalOrderStatus);
      } else {
        await updateBookingOrderStatus(orderId, nextStatus as BookingOrderStatus);
      }
    },
    onSuccess: async (_data, nextStatus) => {
      await queryClient.invalidateQueries({ queryKey: sellerOrdersQueryKey(facilityFilter) });
      await queryClient.invalidateQueries({ queryKey: ["sellerOrders"] });
      const message =
        nextStatus === "CANCELLED"
          ? "Đơn hàng đã bị từ chối."
          : nextStatus === "CONFIRMED"
            ? "Đơn hàng đã được xác nhận."
            : nextStatus === "SHIPPED"
              ? "Đơn hàng đã chuyển sang trạng thái đang giao."
              : nextStatus === "DELIVERED"
                ? "Đơn hàng đã được giao."
                : nextStatus === "RETURNED"
                  ? "Đơn thuê đã được nhận lại."
                  : "Đơn hàng đã hoàn thành.";
      toast({ title: "Cập nhật thành công", description: message });
    },
    onError: (error) => {
      const view = mapApiError(error, {
        fallbackTitle: "Không thể cập nhật đơn",
        fallbackMessage: "Vui lòng thử lại sau.",
      });
      toast({
        variant: "destructive",
        title: view.title,
        description: view.message,
      });
    },
  });

  if (actions.length === 0) return null;

  return (
    <div className="flex gap-2 flex-wrap justify-end">
      {actions.map((action) => (
        <Button
          key={action.status}
          size="sm"
          variant={action.variant ?? "default"}
          className={`rounded-full text-xs h-8 ${action.className ?? ""}`}
          disabled={mutation.isPending}
          onClick={() => mutation.mutate(action.status)}
        >
          {mutation.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            action.label
          )}
        </Button>
      ))}
    </div>
  );
}
