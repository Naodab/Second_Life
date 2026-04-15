import type { OrderStatus } from "@/lib/mock-data";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  completed: "Đã hoàn thành",
  pending_approval: "Chờ duyệt",
  shipping: "Đang giao",
  waiting_confirm: "Chờ xác nhận",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  completed: "bg-green-100 text-green-700",
  pending_approval: "bg-amber-100 text-amber-700",
  shipping: "bg-blue-100 text-blue-700",
  waiting_confirm: "bg-purple-100 text-purple-700",
};
