import { useMemo } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Clock, Loader2, MessageSquare, Package, ShoppingBag } from "lucide-react";

import { ApiErrorState } from "@/components/errors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import {
  ORDER_STATUS_LABELS,
  ORDER_TABS,
  buildOrdersPath,
  canCancelOrder,
  formatOrderDate,
  formatPickupTime,
  formatRentalPeriod,
  orderDisplayTitle,
  orderListingHref,
  orderLineTotal,
  orderStatusBadgeClass,
  orderThumbnail,
  orderUnitPrice,
  parseOrderTabFromSearch,
  useMyOrdersPage,
  type OrderTab,
} from "./useMyOrdersPage";
import { OrderCancelButton } from "./OrderCancelButton";
import { buildMessagesHref } from "@/lib/message-navigation";

export default function Orders() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const activeTab = useMemo(() => parseOrderTabFromSearch(search), [search]);
  const { filteredOrders, orders, isLoading, contextsLoading, isError, errorView, refetch } =
    useMyOrdersPage(activeTab);

  const handleTabChange = (value: string) => {
    setLocation(buildOrdersPath(value as OrderTab), { replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 pt-8 pb-20 dark:to-muted/15">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[40vh] gap-4 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Đang tải đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (isError && errorView) {
    return (
      <ApiErrorState
        variant="fullscreen"
        model={errorView}
        onRetry={refetch}
        homeHref="/"
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 pt-8 pb-20 dark:to-muted/15">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Package className="w-8 h-8 text-primary" /> Đơn hàng của tôi
          </h1>
          <p className="text-sm text-muted-foreground">
            {orders.length} đơn hàng
            {contextsLoading ? " · đang tải thông tin sản phẩm…" : null}
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden p-6">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="bg-muted/60 rounded-xl p-1 mb-6 flex flex-wrap h-auto w-full justify-start">
              {ORDER_TABS.map((tab) => {
                const count =
                  tab.value === "all"
                    ? orders.length
                    : orders.filter((o) => o.status === tab.value).length;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="rounded-lg data-[state=active]:shadow-sm"
                  >
                    {tab.label}
                    {count > 0 ? (
                      <span className="ml-1.5 text-xs opacity-70">({count})</span>
                    ) : null}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <div className="space-y-6">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <img
                    src={`${import.meta.env.BASE_URL}images/empty-cart.png`}
                    alt="Không có đơn hàng"
                    className="w-32 h-32 mx-auto opacity-50 mb-4"
                  />
                  <h3 className="text-lg font-bold text-foreground">Không có đơn hàng nào</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {activeTab === "all"
                      ? "Bạn chưa có đơn hàng nào."
                      : "Không có đơn hàng nào trong trạng thái này."}
                  </p>
                  <Link href="/search">
                    <Button className="mt-6 rounded-full">Khám phá sản phẩm</Button>
                  </Link>
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const listingHref = orderListingHref(order);
                  const unitPrice = orderUnitPrice(order);
                  const lineTotal = orderLineTotal(order);
                  const isRent = order.kind === "rent";

                  return (
                    <div
                      key={order.id}
                      className="border border-border rounded-2xl p-5 hover:border-primary/30 transition-colors bg-background/60"
                    >
                      <div className="flex flex-wrap justify-between items-center gap-3 mb-4 pb-4 border-b border-dashed border-border">
                        <div className="flex flex-col gap-1 min-w-0 flex-1">
                          <span className="text-xs text-muted-foreground">Mã đơn</span>
                          <span className="font-mono text-xs sm:text-sm break-all text-foreground">
                            {order.id}
                          </span>
                          <span className="text-xs text-muted-foreground mt-1">
                            {formatOrderDate(order.createdAt)}
                          </span>
                        </div>
                        <Badge variant="outline" className={orderStatusBadgeClass(order.status)}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </Badge>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        {listingHref ? (
                          <Link href={listingHref}>
                            <img
                              src={orderThumbnail(order)}
                              alt={orderDisplayTitle(order)}
                              className="w-20 h-20 rounded-xl object-cover border border-border cursor-pointer"
                            />
                          </Link>
                        ) : (
                          <img
                            src={orderThumbnail(order)}
                            alt={orderDisplayTitle(order)}
                            className="w-20 h-20 rounded-xl object-cover border border-border"
                          />
                        )}

                        <div className="flex-1 min-w-0">
                          {listingHref ? (
                            <Link href={listingHref}>
                              <h4 className="font-bold text-lg line-clamp-2 hover:text-primary transition-colors">
                                {orderDisplayTitle(order)}
                              </h4>
                            </Link>
                          ) : (
                            <h4 className="font-bold text-lg line-clamp-2">{orderDisplayTitle(order)}</h4>
                          )}

                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-[10px] uppercase">
                              {isRent ? "Thuê" : "Mua"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Số lượng: {order.quantity}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              {isRent
                                ? `Thời gian thuê: ${formatRentalPeriod(order)}`
                                : `Nhận hàng dự kiến: ${formatPickupTime(order.pickupTime)}`}
                            </span>
                          </div>

                          {order.status === "PENDING" && (
                            <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
                              Đang chờ chủ sản phẩm xác nhận đơn.
                            </p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          {lineTotal != null ? (
                            <>
                              <p className="font-bold text-xl">{formatCurrency(lineTotal)}</p>
                              {!isRent && order.quantity > 1 && unitPrice != null && (
                                <p className="text-[11px] text-muted-foreground mt-1">
                                  {formatCurrency(unitPrice)} × {order.quantity}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground">Giá thỏa thuận</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-border">
                        {canCancelOrder(order) && (
                          <OrderCancelButton orderId={order.id} orderKind={order.kind} />
                        )}
                        {listingHref && (
                          <Link href={listingHref}>
                            <Button variant="outline" size="sm" className="rounded-full">
                              <ShoppingBag className="w-4 h-4 mr-2" /> Xem sản phẩm
                            </Button>
                          </Link>
                        )}
                        {order.context?.facilityId ? (
                          <Link
                            href={buildMessagesHref({
                              facilityId: order.context.facilityId,
                              orderId: order.id,
                              orderKind: order.kind,
                              orderStatus: order.status,
                              orderTitle: orderDisplayTitle(order),
                              thumbnailUrl: orderThumbnail(order),
                              orderAmount: orderLineTotal(order) ?? undefined,
                            })}
                          >
                            <Button variant="outline" size="sm" className="rounded-full">
                              <MessageSquare className="w-4 h-4 mr-2" /> Liên hệ người bán
                            </Button>
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
