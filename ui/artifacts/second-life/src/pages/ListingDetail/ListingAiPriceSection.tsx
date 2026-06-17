import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { suggestAiPrice, type AiSuggestPriceResponse } from "@/api/ai";
import type { AttributeDto, ListingType, RentUnit } from "@/api/listing";
import { AiPriceSuggestionPanel } from "@/components/AiPriceSuggestionPanel";
import { useToast } from "@/hooks/use-toast";
import { mapApiError } from "@/lib/api-error";
import {
  attributeDtosToLines,
  buildSuggestPriceRequest,
  loadProductImagesForAi,
} from "@/lib/ai-price-suggestion";
import { cn } from "@/lib/utils";

type Props = {
  productName: string;
  productDescription?: string | null;
  listingTitle: string;
  listingDescription?: string | null;
  listingType: ListingType;
  rentUnit?: RentUnit | null;
  primarySubCategoryId?: string | null;
  subCategoryName?: string | null;
  specAttributes: AttributeDto[];
  manufactureYear?: number | null;
  locationLine?: string | null;
  currentListedPriceVnd?: number | null;
  medias?: { mediaUrl?: string | null; mediaType?: string | null; isThumbnail?: boolean | null }[] | null;
  thumbnailUrl?: string | null;
  variantLabel?: string | null;
  cachedAiPriceVnd?: number | null;
  imageUrls?: string[];
};

export function ListingAiPriceSection({
  productName,
  productDescription,
  listingTitle,
  listingDescription,
  listingType,
  rentUnit,
  primarySubCategoryId,
  subCategoryName,
  specAttributes,
  manufactureYear,
  locationLine,
  currentListedPriceVnd,
  medias,
  thumbnailUrl,
  variantLabel,
  cachedAiPriceVnd,
  imageUrls,
}: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<AiSuggestPriceResponse | null>(null);

  const handleSuggest = async () => {
    if (!productName.trim()) return;
    setLoading(true);
    try {
      const images = await loadProductImagesForAi(medias, thumbnailUrl);
      const result = await suggestAiPrice(
        buildSuggestPriceRequest({
          productName,
          productDescription,
          listingTitle,
          listingDescription,
          listingType,
          variantLabel,
          primarySubCategoryId: primarySubCategoryId?.trim() || undefined,
          subCategoryIds: primarySubCategoryId?.trim() ? [primarySubCategoryId.trim()] : undefined,
          subCategoryNames: subCategoryName?.trim() ? [subCategoryName.trim()] : undefined,
          attributeLines: attributeDtosToLines(specAttributes),
          manufactureYear,
          rentUnit,
          regionName: locationLine,
          currentListedPriceVnd,
          images: images.length > 0 ? images : undefined,
          imageUrls: images.length === 0 ? imageUrls : undefined,
        }),
      );
      setSuggestion(result);
      if (!result.suggestedPriceVnd) {
        toast({
          title: "Chưa ước tính được giá",
          description: result.reasoningBrief ?? "Thử lại sau hoặc xem tin tương tự trên thị trường.",
          variant: "destructive",
        });
      }
    } catch (err) {
      const mapped = mapApiError(err);
      toast({ title: mapped.title, description: mapped.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const showCachedHint =
    !suggestion &&
    cachedAiPriceVnd != null &&
    cachedAiPriceVnd > 0;

  return (
    <div className="mb-8 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Gợi ý giá</p>
          <p className="text-xs text-muted-foreground mt-0.5">Tham khảo khi mua/bán điện thoại.</p>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => void handleSuggest()}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 rounded-full border border-violet-300 bg-background px-4 py-2 text-sm font-medium text-violet-700 transition-colors",
            "hover:bg-violet-50 disabled:pointer-events-none disabled:opacity-50",
            "dark:border-violet-700 dark:bg-background/40 dark:text-violet-300 dark:hover:bg-violet-950/40",
          )}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Đang phân tích…" : suggestion ? "Làm mới" : "Xem gợi ý giá"}
        </button>
      </div>

      {showCachedHint ? (
        <p className="text-xs text-muted-foreground">
          Gợi ý lúc đăng:{" "}
          <span className="font-medium tabular-nums text-foreground">
            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(
              cachedAiPriceVnd,
            )}
          </span>
        </p>
      ) : null}

      {suggestion ? (
        <AiPriceSuggestionPanel
          suggestion={suggestion}
          listingType={listingType}
          rentUnit={rentUnit}
          currentListedPriceVnd={currentListedPriceVnd}
          minimal
        />
      ) : null}
    </div>
  );
}
