import { useState, useMemo, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useCart } from "@/hooks/use-mock-api";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/lib/mock-data";
import { ImageSlider } from "./ImageSlider";
import { ReviewMediaLightbox } from "./ReviewMediaLightbox";
import { useListingDetailPage } from "./useListingDetailPage";
import { priceBandLabel } from "./listing-detail-utils";
import {
  buildListingVariantAxes,
  defaultVariantSelection,
  findRowMatchingSelection,
  lineBuyUnitPrice,
  lineRentUnitPrice,
  productVariantStock,
} from "./listing-variant-selection";
import { ListingDetailSkeleton } from "./ListingDetailSkeleton";
import { ListingDetailNotFound } from "./ListingDetailNotFound";
import { ListingDetailBreadcrumb } from "./ListingDetailBreadcrumb";
import { ListingProductSummary } from "./ListingProductSummary";
import { ListingFacilitySection } from "./ListingFacilitySection";
import { ListingReviewsSection } from "./ListingReviewsSection";
import { ListingSimilarSection } from "./ListingSimilarSection";
import { ListingBuyDialog } from "./ListingBuyDialog";
import { ListingRentDialog } from "./ListingRentDialog";
import type { ListingReviewRow } from "./types";

export default function ListingDetail() {
  const [, params] = useRoute("/listing/:id");
  const listingId = params?.id ?? "";

  const {
    data,
    isLoading,
    error,
    images,
    specAttributes,
    totalStock,
    locationLine,
    buyPrice,
    rentPrice,
    cartBridge,
    similarInfinite,
    similarItems,
    showSimilarBlock,
    subId,
  } = useListingDetailPage(listingId);

  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [buyQty, setBuyQty] = useState(1);
  const [rentStartDate, setRentStartDate] = useState("");
  const [rentEndDate, setRentEndDate] = useState("");
  const [rentQty, setRentQty] = useState(1);
  const [rentError, setRentError] = useState<string | null>(null);
  const [rentValid, setRentValid] = useState(false);
  const [reviewLightbox, setReviewLightbox] = useState<{ media: string[]; idx: number } | null>(null);
  const [variantSelection, setVariantSelection] = useState<Record<string, string>>({});

  const { addToCart } = useCart();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const reviews: ListingReviewRow[] = [];

  const variantAxes = useMemo(() => (data ? buildListingVariantAxes(data) : []), [data]);

  const matchedVariantRow = useMemo(() => {
    if (!data || variantAxes.length === 0) return null;
    return findRowMatchingSelection(data, variantAxes, variantSelection);
  }, [data, variantAxes, variantSelection]);

  const dialogLineStock = useMemo(() => {
    if (!data) return 0;
    if (variantAxes.length === 0) return totalStock;
    if (!matchedVariantRow) return 0;
    return productVariantStock(matchedVariantRow.lv);
  }, [data, variantAxes.length, matchedVariantRow, totalStock]);

  const dialogBuyUnitPrice = useMemo(() => {
    if (!data) return 0;
    if (variantAxes.length === 0) return buyPrice;
    if (!matchedVariantRow) return 0;
    return lineBuyUnitPrice(data, matchedVariantRow.lv);
  }, [data, variantAxes.length, matchedVariantRow, buyPrice]);

  const dialogRentUnitPrice = useMemo(() => {
    if (!data) return 0;
    if (variantAxes.length === 0) return rentPrice;
    if (!matchedVariantRow) return 0;
    return lineRentUnitPrice(data, matchedVariantRow.lv);
  }, [data, variantAxes.length, matchedVariantRow, rentPrice]);

  useEffect(() => {
    setVariantSelection({});
  }, [listingId]);

  useEffect(() => {
    if (!data || variantAxes.length === 0) return;
    setVariantSelection((prev) => {
      if (Object.keys(prev).length > 0) return prev;
      return defaultVariantSelection(data, variantAxes);
    });
  }, [data, variantAxes]);

  useEffect(() => {
    const cap = dialogLineStock > 0 ? dialogLineStock : 1;
    setBuyQty((q) => (dialogLineStock <= 0 ? 1 : Math.min(Math.max(1, q), cap)));
    setRentQty((q) => (dialogLineStock <= 0 ? 1 : Math.min(Math.max(1, q), cap)));
  }, [dialogLineStock]);

  const handleVariantAxisChange = (axisKey: string, valueId: string) => {
    setVariantSelection((prev) => ({ ...prev, [axisKey]: valueId }));
  };

  const buildProductForCart = (): Product | null => {
    if (!cartBridge || !data) return null;
    const label = matchedVariantRow?.pv?.label?.trim();
    const name =
      variantAxes.length > 0 && label ? `${cartBridge.name} (${label})` : cartBridge.name;
    return {
      ...cartBridge,
      name,
      stock: dialogLineStock,
    };
  };

  const handleCheckoutNow = (mode: "buy" | "rent") => {
    const base = buildProductForCart();
    if (!base) return;
    if (mode === "buy" && (dialogLineStock <= 0 || dialogBuyUnitPrice <= 0)) return;
    if (mode === "rent" && (dialogLineStock <= 0 || dialogRentUnitPrice <= 0)) return;

    const product: Product =
      mode === "buy"
        ? { ...base, buyPrice: dialogBuyUnitPrice, rentPrice: undefined }
        : { ...base, rentPrice: dialogRentUnitPrice, buyPrice: undefined };

    addToCart(
      product,
      mode === "buy" ? buyQty : rentQty,
      mode === "rent" && rentStartDate && rentEndDate
        ? { start: new Date(rentStartDate), end: new Date(rentEndDate) }
        : undefined,
    );
    setIsBuyModalOpen(false);
    setIsRentModalOpen(false);
    setRentError(null);
    setRentValid(false);
    navigate("/checkout");
  };

  const handleQuickAddToCart = () => {
    if (!cartBridge) return;
    addToCart(cartBridge, 1);
    toast({ title: "Đã thêm vào giỏ hàng!", description: `${cartBridge.name} đã được thêm vào giỏ.` });
  };

  const handleRentCheck = () => {
    setRentError(null);
    setRentValid(false);
    if (!rentStartDate || !rentEndDate) {
      setRentError("Vui lòng chọn ngày bắt đầu và kết thúc.");
      return;
    }
    const start = new Date(rentStartDate);
    const end = new Date(rentEndDate);
    if (end <= start) {
      setRentError("Ngày kết thúc phải sau ngày bắt đầu.");
      return;
    }
    if (rentQty > dialogLineStock && dialogLineStock > 0) {
      setRentError(`Chỉ còn ${dialogLineStock} trong kho.`);
      return;
    }
    setRentValid(true);
  };

  const rentDays =
    rentStartDate && rentEndDate
      ? Math.max(0, Math.ceil((new Date(rentEndDate).getTime() - new Date(rentStartDate).getTime()) / 86400000))
      : 0;

  const setRentModalOpen = (open: boolean) => {
    setIsRentModalOpen(open);
    if (!open) {
      setRentError(null);
      setRentValid(false);
    }
  };

  if (isLoading || !listingId) {
    return <ListingDetailSkeleton />;
  }

  if (error || !data || !cartBridge) {
    return <ListingDetailNotFound />;
  }

  const { listing, product } = data;
  const facility = data.facility;
  const subName = product.primarySubCategory?.name ?? "Danh mục";
  const conditionLabel = listing.listingType === "RENT" ? "Cho thuê" : "Đăng bán";

  const avgRating =
    facility?.averageRating != null && facility.averageRating > 0
      ? Number(facility.averageRating)
      : cartBridge.rating;

  const band = priceBandLabel(listing.minPrice, listing.maxPrice);
  const outOfStock = totalStock <= 0;
  const heroImage = images[0] ?? "";

  const buyCheckoutDisabled = dialogLineStock <= 0 || dialogBuyUnitPrice <= 0;
  const rentCheckoutDisabled = !rentValid || dialogLineStock <= 0 || dialogRentUnitPrice <= 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/25 pb-20 dark:from-background dark:via-background dark:to-muted/15">
      <ListingDetailBreadcrumb subId={subId} subName={subName} listingTitle={listing.title} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-8 lg:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <ImageSlider images={images} productName={listing.title} />
          </div>

          <div className="lg:col-span-7 flex flex-col gap-6">
            <ListingProductSummary
              title={listing.title}
              listingDescription={(listing.description ?? "").trim()}
              productDescription={product.description}
              subName={subName}
              conditionLabel={conditionLabel}
              priceBand={band}
              buyPrice={buyPrice}
              rentPrice={rentPrice}
              listingType={listing.listingType}
              specAttributes={specAttributes}
              avgRating={avgRating}
              reviewCount={reviews.length}
              totalStock={totalStock}
              locationLine={locationLine}
              outOfStock={outOfStock}
              onOpenBuy={() => setIsBuyModalOpen(true)}
              onOpenRent={() => {
                setIsRentModalOpen(true);
                setRentError(null);
                setRentValid(false);
              }}
              onQuickAddToCart={handleQuickAddToCart}
            />
          </div>
        </div>

        {facility?.id ? <ListingFacilitySection facility={facility} /> : null}

        <ListingReviewsSection
          avgRating={avgRating}
          reviews={reviews}
          onOpenReviewMedia={(media, idx) => setReviewLightbox({ media, idx })}
        />

        <ListingSimilarSection
          show={showSimilarBlock}
          listingType={listing.listingType}
          similarInfinite={{
            isPending: similarInfinite.isPending,
            isError: similarInfinite.isError,
            hasNextPage: Boolean(similarInfinite.hasNextPage),
            isFetchingNextPage: similarInfinite.isFetchingNextPage,
            fetchNextPage: () => void similarInfinite.fetchNextPage(),
          }}
          similarItems={similarItems}
        />
      </div>

      <ListingBuyDialog
        open={isBuyModalOpen}
        onOpenChange={setIsBuyModalOpen}
        heroImageUrl={heroImage}
        cartBridge={cartBridge}
        variantAxes={variantAxes}
        variantSelection={variantSelection}
        onVariantSelectionChange={handleVariantAxisChange}
        lineStock={dialogLineStock}
        lineUnitBuyPrice={dialogBuyUnitPrice}
        buyQty={buyQty}
        onBuyQtyChange={setBuyQty}
        checkoutDisabled={buyCheckoutDisabled}
        onCheckout={() => handleCheckoutNow("buy")}
      />

      <ListingRentDialog
        open={isRentModalOpen}
        onOpenChange={setRentModalOpen}
        heroImageUrl={heroImage}
        cartBridge={cartBridge}
        variantAxes={variantAxes}
        variantSelection={variantSelection}
        onVariantSelectionChange={handleVariantAxisChange}
        lineStock={dialogLineStock}
        lineUnitRentPrice={dialogRentUnitPrice}
        rentStartDate={rentStartDate}
        rentEndDate={rentEndDate}
        onRentStartDateChange={(v) => {
          setRentStartDate(v);
          setRentValid(false);
          setRentError(null);
        }}
        onRentEndDateChange={(v) => {
          setRentEndDate(v);
          setRentValid(false);
          setRentError(null);
        }}
        rentQty={rentQty}
        onRentQtyChange={(next) => {
          setRentQty(next);
          setRentValid(false);
          setRentError(null);
        }}
        rentDays={rentDays}
        rentError={rentError}
        rentValid={rentValid}
        checkoutDisabled={rentCheckoutDisabled}
        onRentCheck={handleRentCheck}
        onCheckout={() => handleCheckoutNow("rent")}
      />

      {reviewLightbox ? (
        <ReviewMediaLightbox media={reviewLightbox.media} startIdx={reviewLightbox.idx} onClose={() => setReviewLightbox(null)} />
      ) : null}
    </div>
  );
}
