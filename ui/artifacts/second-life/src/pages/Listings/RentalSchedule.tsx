import { CalendarClock } from "lucide-react";
import { MOCK_RENTAL_SLOTS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function RentalSchedule({ productId }: { productId: string }) {
  const slots = MOCK_RENTAL_SLOTS[productId] || [];
  if (!slots.length) return null;

  const statusConfig = {
    booked: { label: "Đã đặt", cls: "bg-red-100 text-red-700 border-red-200" },
    available: { label: "Trống", cls: "bg-green-50 text-green-700 border-green-200" },
    pending: { label: "Chờ xác nhận", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  };

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <h3 className="font-bold mb-4 flex items-center gap-2">
        <CalendarClock className="w-4 h-4 text-primary" /> Lịch cho thuê
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="pb-2 pr-4 font-semibold text-muted-foreground text-xs">Ngày</th>
              <th className="pb-2 pr-4 font-semibold text-muted-foreground text-xs">Trạng thái</th>
              <th className="pb-2 font-semibold text-muted-foreground text-xs">Khách thuê</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {slots.map((slot, i) => {
              const cfg = statusConfig[slot.status];
              const dateLabel = new Date(slot.date).toLocaleDateString("vi", {
                weekday: "short",
                day: "2-digit",
                month: "2-digit",
              });
              return (
                <tr key={i} className="hover:bg-muted/50">
                  <td className="py-2.5 pr-4 font-medium">{dateLabel}</td>
                  <td className="py-2.5 pr-4">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border", cfg.cls)}>
                      {cfg.label}
                    </span>
                  </td>
                  <td className="py-2.5 text-muted-foreground text-sm">{slot.buyerName || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
