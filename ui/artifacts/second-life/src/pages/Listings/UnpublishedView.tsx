import { useState } from "react";
import { CheckCircle2, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { PendingProduct } from "./types";

export function UnpublishedView({
  products,
  onPublish,
}: {
  products: PendingProduct[];
  onPublish: (id: string, price?: number) => void;
}) {
  const [prices, setPrices] = useState<Record<string, string>>({});

  if (products.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border">
        <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
        <h3 className="font-bold text-lg mb-1">Không có sản phẩm nào chờ đăng</h3>
        <p className="text-muted-foreground text-sm">Tất cả sản phẩm đã được đăng.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold mb-1">Sản phẩm chưa đăng</h2>
        <p className="text-sm text-muted-foreground">
          {products.length} sản phẩm đang chờ định giá và đăng bán
        </p>
      </div>
      {products.map((p) => {
        const price = prices[p.id] || (p.price ? String(p.price) : "");
        const setPrice = (val: string) =>
          setPrices((prev) => ({
            ...prev,
            [p.id]: val,
          }));
        return (
          <div key={p.id} className="bg-white rounded-2xl border shadow-sm p-5 flex gap-4">
            <img src={p.previewUrl} className="w-20 h-20 rounded-xl object-cover border flex-shrink-0" alt="" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold">{p.name}</h3>
                <Badge variant="outline" className="text-xs flex-shrink-0 bg-amber-50 text-amber-700 border-amber-200">
                  <Bell className="w-3 h-3 mr-1" /> Chờ đăng
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{p.description}</p>
              <p className="text-xs text-muted-foreground mb-3">
                {p.variantCount} variants • Tong so luong: {p.totalQty}
              </p>
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Gia (VND)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="h-8 w-36 text-sm rounded-lg"
                  />
                </div>
                <Button
                  size="sm"
                  className="rounded-full h-8"
                  onClick={() => onPublish(p.id, price ? Number(price) : undefined)}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Đăng ngay
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
