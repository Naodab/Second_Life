import type { ListingReviewRow } from "./types";
import { StarDisplay } from "./StarDisplay";
import { cn } from "@/lib/utils";

type Props = {
  avgRating: number;
  reviews: ListingReviewRow[];
  onOpenReviewMedia: (media: string[], imageIndexInAllMedia: number) => void;
};

export function ListingReviewsSection({ avgRating, reviews, onOpenReviewMedia }: Props) {
  return (
    <div
      className={cn(
        "mt-12 rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8",
        "ring-1 ring-border/40 dark:border-border/50 dark:bg-card/95 dark:shadow-2xl dark:shadow-black/20 dark:ring-border/30",
      )}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center mb-8">
        <div className="space-y-1">
          <h2 className="text-xl font-display font-bold tracking-tight text-foreground sm:text-2xl">Đánh giá tin đăng</h2>
          <p className="text-muted-foreground text-sm max-w-md">
            Phần đánh giá chi tiết theo đơn sẽ được đồng bộ sau
          </p>
        </div>
        <div
          className={cn(
            "sm:ml-auto flex items-center gap-3 rounded-2xl border px-5 py-3.5",
            "border-amber-500/30 bg-amber-50/90 dark:border-amber-400/25 dark:bg-amber-950/45",
          )}
        >
          <span className="text-4xl font-bold tabular-nums text-amber-700 dark:text-amber-400">{avgRating.toFixed(1)}</span>
          <div>
            <StarDisplay rating={avgRating} size="md" />
            <p className="text-xs text-muted-foreground mt-1">Điểm cơ sở</p>
          </div>
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-12 px-4 rounded-2xl border border-dashed border-border/70 bg-muted/20 dark:bg-muted/10">
          Chưa có đánh giá cụ thể cho tin đăng này.
        </p>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => {
            const allMedia = [...(review.images ?? []), ...(review.videos ?? [])];
            return (
              <div key={review.id} className="pb-6 border-b border-border/60 last:border-0 last:pb-0">
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={review.userAvatar}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-border/60 dark:ring-border/40"
                    alt={review.userName}
                  />
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">{review.userName}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StarDisplay rating={review.rating} />
                      <span className="text-xs text-muted-foreground">{review.date}</span>
                    </div>
                  </div>
                </div>
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 mb-3 pl-[3.25rem] flex-wrap">
                    {review.images.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => onOpenReviewMedia(allMedia, i)}
                        className="w-20 h-20 rounded-xl overflow-hidden border border-border/70 hover:opacity-90 transition-opacity flex-shrink-0 ring-1 ring-border/40 dark:border-border/50"
                      >
                        <img src={img} alt="Ảnh review" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-muted-foreground text-sm pl-[3.25rem] leading-relaxed">{review.comment}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
