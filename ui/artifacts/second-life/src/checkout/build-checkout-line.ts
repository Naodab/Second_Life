import type { ListingPublicDetailResponse } from "@/api/listing";
import { collectImageUrls } from "@/pages/ListingDetail/listing-detail-utils";
import { lineBuyUnitPrice, lineRentUnitPrice, productVariantStock } from "@/pages/ListingDetail/listing-variant-selection";
import { findListingVariantRow } from "@/pages/ListingDetail/cart-adapter";
import type { CheckoutLineInput } from "./checkout-session";

export type CheckoutLineItem = {
  lineId: string;
  listingId: string;
  listingVariantId: string;
  name: string;
  images: string[];
  facilityId: string;
  facilityName: string;
  facilityImageUrl: string;
  facilityOwnerId: string;
  facilityOwnerName: string;
  facilityOwnerAvatarUrl: string | null;
  mode: "buy" | "rent";
  quantity: number;
  unitPrice: number;
  buyPrice: number;
  rentPrice: number;
  rentalDates?: { start: Date; end: Date };
  catalogStock: number;
  availableQuantity: number | null;
  inventoryTracked: boolean;
};

export function buildCheckoutLineItem(
  input: CheckoutLineInput,
  detail: ListingPublicDetailResponse,
  availability: { tracked: boolean; availableQuantity: number | null },
): CheckoutLineItem | null {
  const row = findListingVariantRow(detail, input.listingVariantId);
  if (!row) return null;

  const { listing, product, facility } = detail;
  const label = row.pv?.label?.trim();
  const baseTitle = listing.title?.trim() || product.name?.trim() || "Sản phẩm";
  const name = label ? `${baseTitle} (${label})` : baseTitle;

  const images = collectImageUrls(detail);
  const catalogStock = productVariantStock(row.lv);
  const unitPrice =
    input.mode === "buy" ? lineBuyUnitPrice(detail, row.lv) : lineRentUnitPrice(detail, row.lv);

  let rentalDates: { start: Date; end: Date } | undefined;
  if (input.mode === "rent" && input.rentalStart && input.rentalEnd) {
    const start = new Date(input.rentalStart);
    const end = new Date(input.rentalEnd);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      rentalDates = { start, end };
    }
  }

  return {
    lineId: `${input.listingVariantId}:${input.mode}`,
    listingId: input.listingId,
    listingVariantId: input.listingVariantId,
    name,
    images: images.length > 0 ? images : ["https://images.unsplash.com/photo-1542838132-92c53300491e?w=480&h=480&fit=crop"],
    facilityId: facility?.id?.trim() ?? "",
    facilityName: facility?.name?.trim() ?? "",
    facilityImageUrl: facility?.imageUrl?.trim() ?? "",
    facilityOwnerId: facility?.ownerId?.trim() ?? "",
    facilityOwnerName: "",
    facilityOwnerAvatarUrl: null,
    mode: input.mode,
    quantity: input.quantity,
    unitPrice,
    buyPrice: input.mode === "buy" ? unitPrice : 0,
    rentPrice: input.mode === "rent" ? unitPrice : 0,
    rentalDates,
    catalogStock,
    availableQuantity: availability.availableQuantity,
    inventoryTracked: availability.tracked,
  };
}
