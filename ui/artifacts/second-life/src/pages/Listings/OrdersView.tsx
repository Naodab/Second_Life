import { useState } from "react";
import { ShoppingBag, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MOCK_ORDERS, type OrderStatus } from "@/lib/mock-data";
import { formatCurrency, cn } from "@/lib/utils";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "./constants";

export function OrdersView({
  facilityId,
  embedded,
}: {
  facilityId: string;
  embedded?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<OrderStatus>("pending_approval");
  const allOrders = MOCK_ORDERS.filter((o) => o.facilityId === facilityId);
  const filtered = allOrders.filter((o) => o.status === activeTab);

  const tabs: { key: OrderStatus; label: string }[] = [
    { key: "pending_approval", label: "Chờ duyệt" },
    { key: "shipping", label: "Đang giao" },
    { key: "waiting_confirm", label: "Chờ xác nhận" },
    { key: "completed", label: "Hoàn thành" },
  ];

  return (
    <div className="space-y-5">
      {!embedded && (
        <div>
          <h2 className="text-xl font-bold mb-1">Đơn hàng</h2>
          <p className="text-sm text-muted-foreground">{allOrders.length} đơn hàng tổng cộng</p>
        </div>
      )}

      <div className="flex w-fit gap-1 rounded-xl bg-muted p-1">
        {tabs.map((t) => {
          const cnt = allOrders.filter((o) => o.status === t.key).length;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActiveTab(t.key)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5",
                activeTab === t.key ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
              {cnt > 0 && (
                <span
                  className={cn(
                    "text-xs rounded-full px-1.5",
                    activeTab === t.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  {cnt}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border bg-card py-16 text-center">
          <ShoppingBag className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-40" />
          <p className="text-muted-foreground">Không có đơn hàng nào trong mục này.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <div key={order.id} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={order.buyerAvatar} />
                    <AvatarFallback>{order.buyerName[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{order.buyerName}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {order.address}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", ORDER_STATUS_COLORS[order.status])}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    #{order.id} • {order.createdAt}
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <img src={item.productImage} className="w-10 h-10 rounded-lg object-cover border" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.mode === "rent" ? `Thuê ${item.rentStart} → ${item.rentEnd}` : "Mua"} • x{item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-primary">{formatCurrency(item.price)}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <p className="font-bold">
                  Tổng: <span className="text-primary">{formatCurrency(order.total)}</span>
                </p>
                <div className="flex gap-2">
                  {order.status === "pending_approval" && (
                    <>
                      <Button size="sm" variant="outline" className="rounded-full text-destructive border-destructive/30 text-xs h-8">
                        Từ chối
                      </Button>
                      <Button size="sm" className="rounded-full text-xs h-8">
                        Xác nhận đơn
                      </Button>
                    </>
                  )}
                  {order.status === "shipping" && (
                    <Button size="sm" className="rounded-full text-xs h-8">
                      Đã giao xong
                    </Button>
                  )}
                  {order.status === "waiting_confirm" && (
                    <Button size="sm" className="rounded-full text-xs h-8 bg-green-600 hover:bg-green-700">
                      Xác nhận hoàn thành
                    </Button>
                  )}
                  {order.status === "completed" && (
                    <Button size="sm" variant="outline" className="rounded-full text-xs h-8">
                      Xem chi tiết
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
