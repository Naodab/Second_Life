import { useMemo, useState } from "react";
import { Loader2, MapPin, ShoppingBag, Store } from "lucide-react";

import {
  customerAddressLine,
  customerDisplayName,
  type BookingOrderStatus,
} from "@/api/booking";
import type { FacilityWithPlaceNames } from "@/api/facility";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ApiErrorState } from "@/components/errors";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, cn } from "@/lib/utils";

import { FacilityOrderActionButtons } from "./FacilityOrderActionButtons";
import {
  ALL_FACILITIES_FILTER,
  FACILITY_ORDER_TABS,
  formatOrderDate,
  formatPickupTime,
  orderDisplayTitle,
  orderStatusBadgeClass,
  orderThumbnail,
  orderUnitPrice,
  ORDER_STATUS_LABELS,
  useManageOrdersPage,
  type FacilityOrderTab,
} from "./useFacilityOrdersPage";

export function OrdersView({
  facilities,
  embedded,
  lockedFacilityId,
}: {
  facilities: FacilityWithPlaceNames[];
  embedded?: boolean;
  lockedFacilityId?: string;
}) {
  const [activeTab, setActiveTab] = useState<FacilityOrderTab>("PENDING");
  const [facilityFilter, setFacilityFilter] = useState(
    lockedFacilityId?.trim() || ALL_FACILITIES_FILTER,
  );

  const effectiveFilter = lockedFacilityId?.trim() || facilityFilter;

  const facilityNameById = useMemo(
    () => new Map(facilities.map((f) => [f.id, f.name])),
    [facilities],
  );

  const { orders, filteredOrders, isLoading, contextsLoading, isError, errorView, refetch } =
    useManageOrdersPage(facilities, effectiveFilter, activeTab);

  const showFacilitySelect = !embedded && !lockedFacilityId?.trim();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Đang tải đơn hàng...
      </div>
    );
  }

  if (isError && errorView) {
    return <ApiErrorState variant="embedded" model={errorView} onRetry={() => void refetch()} />;
  }

  return (
    <div className="space-y-5">
      {!embedded && (
        <div>
          <h2 className="text-xl font-bold mb-1">Đơn hàng</h2>
          <p className="text-sm text-muted-foreground">{orders.length} đơn hàng tổng cộng</p>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-fit max-w-full overflow-x-auto gap-1 rounded-xl bg-muted p-1">
          {FACILITY_ORDER_TABS.map((t) => {
            const cnt = orders.filter((o) => o.status === t.value).length;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setActiveTab(t.value)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5",
                  activeTab === t.value
                    ? "bg-card text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
                {cnt > 0 && (
                  <span
                    className={cn(
                      "text-xs rounded-full px-1.5",
                      activeTab === t.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {cnt}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {showFacilitySelect && (
          <Select value={facilityFilter} onValueChange={setFacilityFilter}>
            <SelectTrigger className="w-full sm:w-[220px] h-10 rounded-xl bg-muted/40">
              <SelectValue placeholder="Chọn cơ sở" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_FACILITIES_FILTER}>Tất cả cơ sở</SelectItem>
              {facilities.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="rounded-2xl border bg-card py-16 text-center">
          <ShoppingBag className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-40" />
          <p className="text-muted-foreground">Không có đơn hàng nào trong mục này.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const unitPrice = orderUnitPrice(order);
            const lineTotal =
              unitPrice != null ? unitPrice * order.quantity : order.price ?? null;
            const customerName = customerDisplayName(order.customer);
            const address = customerAddressLine(order.customer);
            const orderFacilityId = order.context?.facilityId?.trim() ?? "";
            const orderFacilityName = orderFacilityId
              ? facilityNameById.get(orderFacilityId) ?? orderFacilityId
              : null;
            const actionFacilityId = orderFacilityId || lockedFacilityId || facilities[0]?.id || "";

            return (
              <div key={order.id} className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{customerName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{customerName}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {address}
                      </p>
                      {order.customer?.phoneNumber?.trim() && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {order.customer.phoneNumber.trim()}
                        </p>
                      )}
                      {orderFacilityName && effectiveFilter === ALL_FACILITIES_FILTER && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Store className="w-3 h-3 shrink-0" />
                          {orderFacilityName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium border",
                        orderStatusBadgeClass(order.status as BookingOrderStatus),
                      )}
                    >
                      {ORDER_STATUS_LABELS[order.status as BookingOrderStatus]}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1 break-all">#{order.id}</p>
                    <p className="text-xs text-muted-foreground">{formatOrderDate(order.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={orderThumbnail(order)}
                    className="w-10 h-10 rounded-lg object-cover border"
                    alt=""
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{orderDisplayTitle(order)}</p>
                    <p className="text-xs text-muted-foreground">
                      Lấy hàng: {formatPickupTime(order.pickupTime)} • x{order.quantity}
                    </p>
                  </div>
                  {contextsLoading && !order.context ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : lineTotal != null ? (
                    <p className="text-sm font-bold text-primary">{formatCurrency(lineTotal)}</p>
                  ) : null}
                </div>

                <div className="flex items-center justify-between pt-3 border-t gap-3">
                  <p className="font-bold">
                    Tổng:{" "}
                    <span className="text-primary">
                      {lineTotal != null ? formatCurrency(lineTotal) : "—"}
                    </span>
                  </p>
                  {actionFacilityId ? (
                    <FacilityOrderActionButtons
                      facilityFilter={effectiveFilter}
                      orderId={order.id}
                      status={order.status}
                    />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
