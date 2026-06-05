import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";

import {
  type RentalPeriodDto,
  fetchListingRentalPeriods,
  fetchListingVariantAvailability,
  fetchListingVariantAvailabilityInRange,
} from "@/api/inventory";
import { useCart } from "@/hooks/use-mock-api";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { buildCheckoutHref, setPendingCheckoutLine } from "@/checkout/checkout-session";
import { useToast } from "@/hooks/use-toast";
import { ImageSlider } from "./ImageSlider";
import { ListingBuyDialog } from "./ListingBuyDialog";
import { ListingDetailBreadcrumb } from "./ListingDetailBreadcrumb";
import { ListingDetailNotFound } from "./ListingDetailNotFound";
import { ListingDetailSkeleton } from "./ListingDetailSkeleton";
import { ListingFacilitySection } from "./ListingFacilitySection";
import { ListingProductSummary } from "./ListingProductSummary";
import { ListingRentDialog } from "./ListingRentDialog";
import { type RentScheduleValidityPayload, type RentScheduleWindow } from "./ListingRentScheduler";
import { ListingReviewsSection } from "./ListingReviewsSection";
import { ListingSimilarSection } from "./ListingSimilarSection";
import { ReviewMediaLightbox } from "./ReviewMediaLightbox";
import { mergeVariantRows, priceBandLabel } from "./listing-detail-utils";
import {
  buildListingVariantAxes,
  defaultVariantSelection,
  findRowMatchingSelection,
  lineBuyUnitPrice,
  lineRentUnitPrice,
  productVariantStock,
} from "./listing-variant-selection";
import type { ListingReviewRow } from "./types";
import { useListingDetailPage } from "./useListingDetailPage";

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
  const [rentQty, setRentQty] = useState(1);
  const [rentWindow, setRentWindow] = useState<RentScheduleWindow | null>(null);
  const [rentValidity, setRentValidity] = useState<RentScheduleValidityPayload>({ ok: false, billUnits: 0 });
  const [reviewLightbox, setReviewLightbox] = useState<{ media: string[]; idx: number } | null>(null);
  const [variantSelection, setVariantSelection] = useState<Record<string, string>>({});

  const { addToCart } = useCart();
  const { requireAuth } = useRequireAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const reviews: ListingReviewRow[] = [];

  const variantAxes = useMemo(() => (data ? buildListingVariantAxes(data) : []), [data]);

  const matchedVariantRow = useMemo(() => {
    if (!data || variantAxes.length === 0) return null;
    return findRowMatchingSelection(data, variantAxes, variantSelection);
  }, [data, variantAxes, variantSelection]);

  const anchorVariantRow = useMemo(() => {
    if (!data) return null;
    const rows = mergeVariantRows(data);
    if (rows.length === 0) return null;
    if (variantAxes.length === 0) return rows[0];
    return matchedVariantRow;
  }, [data, variantAxes.length, matchedVariantRow]);

  const listingVariantId = useMemo(() => anchorVariantRow?.lv.id ?? null, [anchorVariantRow]);

  const dialogCatalogStock = useMemo(() => {
    if (!data) return 0;
    if (variantAxes.length === 0) return totalStock;
    if (!matchedVariantRow) return 0;
    return productVariantStock(matchedVariantRow.lv);
  }, [data, variantAxes.length, matchedVariantRow, totalStock]);

  const dialogBuyUnitPrice = useMemo(() => {
    if (!data || !anchorVariantRow) return 0;
    return lineBuyUnitPrice(data, anchorVariantRow.lv);
  }, [anchorVariantRow, data]);

  const dialogRentUnitPrice = useMemo(() => {
    if (!data || !anchorVariantRow) return 0;
    return lineRentUnitPrice(data, anchorVariantRow.lv);
  }, [anchorVariantRow, data]);

  const buyInventoryEnabled =
    Boolean(listingVariantId) && isBuyModalOpen && dialogCatalogStock > 0;

  const buyAvailabilityQuery = useQuery({
    queryKey: ["listingVariantAvailability", listingVariantId, "BUY"] as const,
    queryFn: () => fetchListingVariantAvailability(listingVariantId!, "BUY"),
    enabled: buyInventoryEnabled,
    staleTime: 10_000,
  });

  const rentInventoryEnabled =
    Boolean(listingVariantId) &&
    isRentModalOpen &&
    dialogCatalogStock > 0 &&
    data?.listing.listingType === "RENT";

  const rentAvailabilityQuery = useQuery({
    queryKey: ["listingVariantAvailability", listingVariantId, "RENT"] as const,
    queryFn: () => fetchListingVariantAvailability(listingVariantId!, "RENT"),
    enabled: rentInventoryEnabled,
    staleTime: 10_000,
  });

  const rentalPeriodsQuery = useQuery({
    queryKey: ["listingRentalPeriods", listingVariantId] as const,
    queryFn: () => fetchListingRentalPeriods(listingVariantId!),
    enabled: rentInventoryEnabled,
    staleTime: 15_000,
  });

  const rentWindowRangeAvailabilityQuery = useQuery({
    queryKey: [
      "listingVariantAvailabilityInRange",
      listingVariantId,
      rentWindow?.startMs,
      rentWindow?.endExclusiveMs,
      rentQty,
    ] as const,
    queryFn: () =>
      fetchListingVariantAvailabilityInRange(listingVariantId!, {
        from: new Date(rentWindow!.startMs).toISOString(),
        to: new Date(rentWindow!.endExclusiveMs).toISOString(),
        quantity: rentQty,
      }),
    enabled: Boolean(rentInventoryEnabled && listingVariantId && rentWindow),
    staleTime: 5_000,
  });

  const stableRentalPeriods = useMemo((): RentalPeriodDto[] => {
    const rows = rentalPeriodsQuery.data;
    return rows?.length ? rows : [];
  }, [rentalPeriodsQuery.data]);

  const effectiveBuyStock = useMemo(() => {
    const q = buyAvailabilityQuery.data;
    if (!q || !q.tracked || q.availableQuantity == null) {
      return dialogCatalogStock;
    }
    return Math.min(dialogCatalogStock, q.availableQuantity);
  }, [buyAvailabilityQuery.data, dialogCatalogStock]);

  /** Max concurrent rent units (catalog / physical stock). Interval overlap is checked separately. */
  const rentConcurrencyCap = useMemo(() => {
    const q = rentAvailabilityQuery.data;
    if (!q || !q.tracked || q.availableQuantity == null) {
      return dialogCatalogStock;
    }
    return Math.min(dialogCatalogStock, q.availableQuantity);
  }, [dialogCatalogStock, rentAvailabilityQuery.data]);

  const rentQtyCap = useMemo(() => {
    if (!rentWindow) return rentConcurrencyCap;
    const r = rentWindowRangeAvailabilityQuery.data;
    if (r?.tracked && r.availableQuantity != null) {
      return Math.min(rentConcurrencyCap, r.availableQuantity);
    }
    return rentConcurrencyCap;
  }, [rentConcurrencyCap, rentWindow, rentWindowRangeAvailabilityQuery.data]);

  const rentRangeBlocked = useMemo(() => {
    if (!rentWindow) return false;
    if (rentWindowRangeAvailabilityQuery.isFetching) return false;
    const r = rentWindowRangeAvailabilityQuery.data;
    if (!r?.tracked || r.availableQuantity == null) return false;
    return r.availableQuantity < rentQty;
  }, [rentWindow, rentQty, rentWindowRangeAvailabilityQuery.data, rentWindowRangeAvailabilityQuery.isFetching]);

  const rentRangeBlockMessage = useMemo(() => {
    if (!rentRangeBlocked) return null;
    const r = rentWindowRangeAvailabilityQuery.data;
    const avail = r?.availableQuantity ?? 0;
    if (avail <= 0) {
      return "Không còn đủ số lượng trong khung thời gian đã chọn.";
    }
    return `Chỉ còn ${avail} sản phẩm trong khung thời gian đã chọn.`;
  }, [rentRangeBlocked, rentWindowRangeAvailabilityQuery.data]);

  const buyAvailabilityLoading = buyInventoryEnabled && buyAvailabilityQuery.isFetching;
  const rentAvailabilityLoading = rentInventoryEnabled && rentAvailabilityQuery.isFetching;

  const onRentValidityChange = useCallback((payload: RentScheduleValidityPayload) => {
    setRentValidity(payload);
  }, []);

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
    setRentWindow(null);
    setRentValidity({ ok: false, billUnits: 0 });
  }, [listingVariantId]);

  useEffect(() => {
    const buyCap = effectiveBuyStock > 0 ? effectiveBuyStock : 1;
    setBuyQty((q) => (effectiveBuyStock <= 0 ? 1 : Math.min(Math.max(1, q), buyCap)));
  }, [effectiveBuyStock]);

  useEffect(() => {
    const rentCap = rentQtyCap > 0 ? rentQtyCap : 1;
    setRentQty((q) => (rentQtyCap <= 0 ? 1 : Math.min(Math.max(1, q), rentCap)));
  }, [rentQtyCap]);

  const handleVariantAxisChange = (axisKey: string, valueId: string) => {
    setVariantSelection((prev) => ({ ...prev, [axisKey]: valueId }));
  };

  const handleCheckoutNow = (mode: "buy" | "rent") => {
    if (!requireAuth()) return;
    if (!data || !listingVariantId) return;
    if (mode === "buy" && (effectiveBuyStock <= 0 || dialogBuyUnitPrice <= 0)) return;
    if (
      mode === "rent" &&
      (dialogRentUnitPrice <= 0 || !rentWindow || !rentValidity.ok || rentRangeBlocked)
    ) {
      return;
    }

    const line =
      mode === "buy"
        ? {
            listingId: data.listing.id,
            listingVariantId,
            quantity: buyQty,
            mode: "buy" as const,
          }
        : {
            listingId: data.listing.id,
            listingVariantId,
            quantity: rentQty,
            mode: "rent" as const,
            rentalStart: new Date(rentWindow!.startMs).toISOString(),
            rentalEnd: new Date(rentWindow!.endExclusiveMs).toISOString(),
            rentUnit,
          };

    setPendingCheckoutLine(line);

    setIsBuyModalOpen(false);
    setIsRentModalOpen(false);
    setRentWindow(null);
    setRentValidity({ ok: false, billUnits: 0 });
    navigate(buildCheckoutHref(line));
  };

  const handleQuickAddToCart = () => {
    if (!requireAuth()) return;
    if (!cartBridge) return;
    addToCart(cartBridge, 1);
    toast({ title: "Đã thêm vào giỏ hàng!", description: `${cartBridge.name} đã được thêm vào giỏ.` });
  };

  const setRentModalOpen = (open: boolean) => {
    setIsRentModalOpen(open);
    if (!open) {
      setRentWindow(null);
      setRentValidity({ ok: false, billUnits: 0 });
    }
  };

  const rentSchedulerResetKey = `${listingVariantId ?? "-"}:${isRentModalOpen ? "1" : "0"}`;

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

  const buyCheckoutDisabled = effectiveBuyStock <= 0 || dialogBuyUnitPrice <= 0;
  const rentCheckoutDisabled =
    dialogRentUnitPrice <= 0 ||
    !rentWindow ||
    !rentValidity.ok ||
    rentRangeBlocked;

  const rentUnit = anchorVariantRow?.lv.rentUnit ?? "DAY";

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
              onOpenBuy={() => {
                if (!requireAuth()) return;
                setIsBuyModalOpen(true);
              }}
              onOpenRent={() => {
                if (!requireAuth()) return;
                setIsRentModalOpen(true);
                setRentWindow(null);
                setRentValidity({ ok: false, billUnits: 0 });
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
        lineStock={effectiveBuyStock}
        lineUnitBuyPrice={dialogBuyUnitPrice}
        buyQty={buyQty}
        onBuyQtyChange={setBuyQty}
        availabilityLoading={buyAvailabilityLoading}
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
        rentUnit={rentUnit}
        schedulerStock={rentConcurrencyCap}
        lineStock={rentQtyCap}
        lineUnitRentPrice={dialogRentUnitPrice}
        rentQty={rentQty}
        onRentQtyChange={setRentQty}
        rentWindow={rentWindow}
        onRentWindowChange={setRentWindow}
        rentValidity={rentValidity}
        onRentValidityChange={onRentValidityChange}
        rentRangeError={rentRangeBlockMessage}
        rentalPeriods={stableRentalPeriods}
        rentalsLoading={
          (rentAvailabilityLoading ||
            rentalPeriodsQuery.isFetching ||
            (Boolean(rentWindow) && rentWindowRangeAvailabilityQuery.isFetching)) &&
          rentInventoryEnabled
        }
        schedulerResetKey={rentSchedulerResetKey}
        checkoutDisabled={rentCheckoutDisabled}
        onCheckout={() => handleCheckoutNow("rent")}
      />

      {reviewLightbox ? (
        <ReviewMediaLightbox media={reviewLightbox.media} startIdx={reviewLightbox.idx} onClose={() => setReviewLightbox(null)} />
      ) : null}
    </div>
  );
}
