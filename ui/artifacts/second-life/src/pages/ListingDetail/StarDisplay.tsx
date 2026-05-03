import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarDisplay({
  rating,
  max = 5,
  size = "sm",
}: {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
}) {
  const sz = size === "lg" ? "w-5 h-5" : size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";
  return (
    <div className="flex">
      {[...Array(max)].map((_, i) => (
        <Star
          key={i}
          className={cn(
            sz,
            i < Math.round(rating)
              ? "fill-amber-400 text-amber-400 dark:fill-amber-500 dark:text-amber-500"
              : "fill-muted text-muted",
          )}
        />
      ))}
    </div>
  );
}
