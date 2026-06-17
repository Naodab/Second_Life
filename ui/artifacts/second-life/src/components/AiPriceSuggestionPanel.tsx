import { Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { confidenceLabelVi } from "@/lib/ai-price-suggestion";
import type { AiSuggestPriceResponse } from "@/api/ai";
import type { RentUnit } from "@/api/listing";

const RENT_UNIT_LABEL: Record<RentUnit, string> = {
  HOUR: "giờ",
  DAY: "ngày",
  WEEK: "tuần",
  MONTH: "tháng",
};

type Props = {
  suggestion: AiSuggestPriceResponse;
  listingType: "BUY" | "RENT" | string;
  rentUnit?: RentUnit | null;
  currentListedPriceVnd?: number | null;
  onApply?: () => void;
  applyLabel?: string;
  compact?: boolean;
  /** Hide price range and confidence — for buyer-facing detail page */
  minimal?: boolean;
};

export function AiPriceSuggestionPanel({
  suggestion,
  listingType,
  rentUnit,
  currentListedPriceVnd,
  onApply,
  applyLabel = "Dùng gợi ý",
  compact,
  minimal,
}: Props) {
  if (!suggestion.suggestedPriceVnd) {
    return (
      <div className="rounded-xl border border-violet-200 bg-violet-50/60 px-4 py-3 text-sm text-violet-900 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-100">
        <p className="font-medium">Chưa ước tính được giá</p>
        {suggestion.reasoningBrief ? (
          <p className="mt-1 text-violet-800/90 dark:text-violet-200/90">{suggestion.reasoningBrief}</p>
        ) : null}
      </div>
    );
  }

  const rentSuffix =
    listingType === "RENT" && rentUnit ? ` / ${RENT_UNIT_LABEL[rentUnit] ?? rentUnit.toLowerCase()}` : "";

  const listedCompare =
    currentListedPriceVnd != null && currentListedPriceVnd > 0 ? (
      <p className="mt-1 text-xs text-violet-800/80 dark:text-violet-200/80">
        Giá đang đăng: {formatCurrency(currentListedPriceVnd)}
        {rentSuffix}
      </p>
    ) : null;

  return (
    <div
      className={
        compact
          ? "rounded-lg border border-violet-200 bg-violet-50/80 px-3 py-2 text-xs text-violet-900 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-100"
          : "rounded-xl border border-violet-200 bg-violet-50/80 px-4 py-3 text-sm text-violet-900 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-100"
      }
    >
      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-300" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-semibold tabular-nums">
            Gợi ý: {formatCurrency(suggestion.suggestedPriceVnd)}
            {rentSuffix}
            {!minimal && suggestion.priceMinVnd && suggestion.priceMaxVnd
              ? ` (${formatCurrency(suggestion.priceMinVnd)} – ${formatCurrency(suggestion.priceMaxVnd)})`
              : ""}
            {!minimal && suggestion.confidence ? ` · ${confidenceLabelVi(suggestion.confidence)}` : ""}
          </p>
          {listedCompare}
          {suggestion.reasoningBrief ? (
            <p className="mt-1 text-violet-800/90 dark:text-violet-200/90">{suggestion.reasoningBrief}</p>
          ) : null}
          {onApply ? (
            <button
              type="button"
              onClick={onApply}
              className="mt-2 inline-flex rounded-full border border-violet-300 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700 transition-colors hover:bg-violet-100 dark:border-violet-600 dark:text-violet-200 dark:hover:bg-violet-900/50"
            >
              {applyLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
