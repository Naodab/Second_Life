import { formatCurrency, cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  sub,
  color = "text-foreground",
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm p-5">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className={cn("text-2xl font-bold", color)}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export function RevenueBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-8 flex-shrink-0">{label}</span>
      <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-primary/80 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium w-20 text-right">{formatCurrency(value)}</span>
    </div>
  );
}
