import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/mock-data";

export function RecommendSlider({ products }: { products: Product[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  if (!products.length) return null;

  const half = Math.ceil(products.length / 2);
  const row1 = products.slice(0, half);
  const row2 = products.slice(half);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scroll(-1)}
        className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-white border shadow-md rounded-full p-2 hover:bg-gray-50"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <div ref={ref} className="overflow-x-auto hide-scrollbar space-y-4 pb-2 px-1">
        <div className="flex gap-4" style={{ minWidth: "max-content" }}>
          {row1.map((p) => (
            <div key={p.id} className="w-52 flex-shrink-0">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
        {row2.length > 0 && (
          <div className="flex gap-4" style={{ minWidth: "max-content" }}>
            {row2.map((p) => (
              <div key={p.id} className="w-52 flex-shrink-0">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => scroll(1)}
        className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-white border shadow-md rounded-full p-2 hover:bg-gray-50"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
