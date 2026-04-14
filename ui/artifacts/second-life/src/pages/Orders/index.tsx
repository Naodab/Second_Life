import { useState } from "react";
import { Package, MessageSquare, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { MOCK_PRODUCTS } from "@/lib/mock-data";

const mockOrders = [
  { id: "ORD-1234", status: "completed", type: "buy", product: MOCK_PRODUCTS[0], date: "2024-05-10" },
  { id: "ORD-1235", status: "shipping", type: "rent", product: MOCK_PRODUCTS[2], date: "2024-05-18" },
  { id: "ORD-1236", status: "pending", type: "buy", product: MOCK_PRODUCTS[1], date: "2024-05-20" },
];

const STATUS_LABELS: Record<string, string> = {
  completed: "Hoàn thành",
  shipping: "Đang giao",
  pending: "Chờ xác nhận",
  processing: "Đang xử lý",
};

export default function Orders() {
  const [activeTab, setActiveTab] = useState("all");

  const filteredOrders = activeTab === "all" ? mockOrders : mockOrders.filter(o => o.status === activeTab);

  return (
    <div className="min-h-screen bg-gray-50/30 pt-8 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <h1 className="text-3xl font-display font-bold mb-8 flex items-center gap-3">
          <Package className="w-8 h-8 text-primary" /> Đơn hàng của tôi
        </h1>

        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden p-6">
          <Tabs defaultValue="all" onValueChange={setActiveTab}>
            <TabsList className="bg-gray-100 rounded-xl p-1 mb-6 flex flex-wrap h-auto">
              <TabsTrigger value="all" className="rounded-lg data-[state=active]:shadow-sm">Tất cả</TabsTrigger>
              <TabsTrigger value="pending" className="rounded-lg data-[state=active]:shadow-sm">Chờ xác nhận</TabsTrigger>
              <TabsTrigger value="processing" className="rounded-lg data-[state=active]:shadow-sm">Đang xử lý</TabsTrigger>
              <TabsTrigger value="shipping" className="rounded-lg data-[state=active]:shadow-sm">Đang giao</TabsTrigger>
              <TabsTrigger value="completed" className="rounded-lg data-[state=active]:shadow-sm">Hoàn thành</TabsTrigger>
            </TabsList>
            
            <div className="space-y-6">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <img src={`${import.meta.env.BASE_URL}images/empty-cart.png`} alt="Không có đơn hàng" className="w-32 h-32 mx-auto opacity-50 mb-4" />
                  <h3 className="text-lg font-bold text-foreground">Không có đơn hàng nào</h3>
                  <p className="text-muted-foreground text-sm">Bạn chưa có đơn hàng nào trong trạng thái này.</p>
                </div>
              ) : (
                filteredOrders.map(order => (
                  <div key={order.id} className="border rounded-2xl p-5 hover:border-primary/30 transition-colors">
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-dashed">
                      <div className="flex items-center gap-3">
                        <span className="font-bold font-mono">{order.id}</span>
                        <span className="text-xs text-muted-foreground">{order.date}</span>
                      </div>
                      <Badge variant="outline" className={
                        order.status === 'completed' ? 'bg-primary/10 text-primary border-primary/20' :
                        order.status === 'shipping' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        'bg-amber-100 text-amber-700 border-amber-200'
                      }>
                        {STATUS_LABELS[order.status] || order.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                      <img src={order.product.images[0]} className="w-20 h-20 rounded-xl object-cover" />
                      <div className="flex-1">
                        <h4 className="font-bold text-lg">{order.product.name}</h4>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary" className="text-[10px] uppercase">
                            {order.type === 'buy' ? 'MUA' : 'THUÊ'}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-xl">
                          {formatCurrency(order.type === 'buy' ? (order.product.buyPrice || 0) : (order.product.rentPrice || 0) * 7)}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button variant="outline" size="sm" className="rounded-full">
                        <MessageSquare className="w-4 h-4 mr-2" /> Liên hệ người bán
                      </Button>
                      {order.status === 'shipping' && (
                        <Button size="sm" className="rounded-full bg-blue-600 hover:bg-blue-700 text-white">
                          Xác nhận đã nhận hàng
                        </Button>
                      )}
                      {order.status === 'completed' && (
                        <Button size="sm" className="rounded-full bg-amber-500 hover:bg-amber-600 text-white">
                          <Star className="w-4 h-4 mr-2 fill-current" /> Viết đánh giá
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
