import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ListingCard } from "@/components/ListingCard";
import type { ListingItemResponse } from "@/api/listing";
import { SIMILAR_PAGE_SIZE } from "./constants";

export type ListingSimilarInfiniteControls = {
  isPending: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
};

type Props = {
  show: boolean;
  listingType: string;
  similarInfinite: ListingSimilarInfiniteControls;
  similarItems: ListingItemResponse[];
};

export function ListingSimilarSection({ show, listingType, similarInfinite, similarItems }: Props) {
  if (!show) return null;

  return (
    <div className="mt-12 lg:mt-14">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          <div className="mb-2 h-1 w-10 rounded-full bg-primary/50 dark:bg-primary/40" aria-hidden />
          <h2 className="text-xl font-display font-bold tracking-tight text-foreground sm:text-2xl">Tin đăng tương tự</h2>
        </div>
      </div>

      {similarInfinite.isPending ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: SIMILAR_PAGE_SIZE }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/5] rounded-3xl ring-1 ring-border/40 dark:ring-border/30" />
          ))}
        </div>
      ) : similarItems.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {similarItems.map((row) => (
              <ListingCard key={row.id} row={row} />
            ))}
          </div>
          {similarInfinite.hasNextPage ? (
            <div className="mt-10 flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="rounded-full px-10 border-border/80 bg-background/60 backdrop-blur-sm transition-all hover:bg-muted/70 active:scale-[0.99] dark:bg-background/30 dark:hover:bg-muted/40"
                disabled={similarInfinite.isFetchingNextPage}
                onClick={() => similarInfinite.fetchNextPage()}
              >
                {similarInfinite.isFetchingNextPage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tải…
                  </>
                ) : (
                  "Tải thêm"
                )}
              </Button>
            </div>
          ) : null}
        </>
      ) : similarInfinite.isError ? (
        <p className="rounded-2xl border border-dashed border-border/70 bg-muted/20 py-10 text-center text-sm text-muted-foreground dark:bg-muted/10">
          Không tải được gợi ý — thử làm mới trang hoặc tìm từ mục tìm kiếm.
        </p>
      ) : (
        <p className="rounded-2xl border border-dashed border-border/70 bg-muted/20 py-10 text-center text-sm text-muted-foreground dark:bg-muted/10">
          Chưa có tin tương tự trong cùng danh mục và khu vực — bạn có thể mở tìm kiếm và nới điều kiện lọc.
        </p>
      )}
    </div>
  );
}
