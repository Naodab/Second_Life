import { TrendingUp, FileText } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MOCK_ORDERS, MOCK_PRODUCTS, type OrderStatus } from "@/lib/mock-data";
import { formatCurrency, cn } from "@/lib/utils";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "./constants";
import { RevenueBar, StatCard } from "./dashboard-widgets";

export function DashboardView({ facilityId }: { facilityId: string }) {
  const orders = MOCK_ORDERS.filter((o) => o.facilityId === facilityId);
  const monthRevenue = orders.filter((o) => o.status === "completed").reduce((s, o) => s + o.total, 0);
  const productCount = MOCK_PRODUCTS.filter((p) => p.facilityId === facilityId).length;
  const rentCount = MOCK_PRODUCTS.filter(
    (p) => p.facilityId === facilityId && (p.type === "rent" || p.type === "both")
  ).length;

  const monthlyData = [
    { label: "T1", value: 1200000 },
    { label: "T2", value: 2500000 },
    { label: "T3", value: 1800000 },
    { label: "T4", value: 3200000 },
    { label: "T5", value: 2100000 },
    { label: "T6", value: 4500000 },
    { label: "T7", value: 3800000 },
    { label: "T8", value: 5200000 },
    { label: "T9", value: 4100000 },
    { label: "T10", value: 6300000 },
    { label: "T11", value: 5700000 },
    { label: "T12", value: monthRevenue },
  ];
  const maxMonthly = Math.max(...monthlyData.map((d) => d.value));
  const yearRevenue = monthlyData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold mb-1">Dashboard</h2>
        <p className="text-muted-foreground text-sm">Tổng quan hoạt động kinh doanh</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Doanh thu tháng này"
          value={formatCurrency(monthRevenue)}
          color="text-primary"
          sub="Tháng 3/2026"
        />
        <StatCard label="Doanh thu năm nay" value={formatCurrency(yearRevenue)} color="text-green-600" />
        <StatCard label="Tổng sản phẩm" value={String(productCount)} sub={`${rentCount} đang cho thuê`} />
        <StatCard
          label="Tổng đơn hàng"
          value={String(orders.length)}
          sub={`${orders.filter((o) => o.status === "completed").length} hoàn thành`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> Doanh thu theo tháng
          </h3>
          <div className="space-y-2.5">
            {monthlyData.map((d) => (
              <RevenueBar key={d.label} label={d.label} value={d.value} max={maxMonthly} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm p-5">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Trạng thái đơn hàng
          </h3>
          <div className="space-y-3">
            {(["pending_approval", "shipping", "waiting_confirm", "completed"] as OrderStatus[]).map((status) => {
              const count = orders.filter((o) => o.status === status).length;
              return (
                <div key={status} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", ORDER_STATUS_COLORS[status])}>
                      {ORDER_STATUS_LABELS[status]}
                    </span>
                  </div>
                  <span className="font-bold">{count}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t">
            <h4 className="font-semibold text-sm mb-3">Đơn hàng gần đây</h4>
            <div className="space-y-2">
              {orders.slice(0, 3).map((o) => (
                <div key={o.id} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={o.buyerAvatar} />
                    <AvatarFallback className="text-xs">{o.buyerName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{o.buyerName}</p>
                    <p className="text-xs text-muted-foreground">{o.items[0].productName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{formatCurrency(o.total)}</p>
                    <p className="text-xs text-muted-foreground">{o.createdAt}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
