import type { FacilityResponse } from "@/api/facility";
import type { ListingPublicDetailResponse } from "@/api/listing";
import { collectImageUrls } from "@/pages/ListingDetail/listing-detail-utils";
import { lineBuyUnitPrice, lineRentUnitPrice, productVariantStock } from "@/pages/ListingDetail/listing-variant-selection";
import { findListingVariantRow } from "@/pages/ListingDetail/cart-adapter";
import type { CheckoutLineInput } from "./checkout-session";

export type CheckoutLineItem = {
  lineId: string;
  cartItemId?: string;
  listingId: string;
  listingVariantId: string;
  name: string;
  images: string[];
  facilityId: string;
  facilityOwnerId: string;
  ownerDisplayName: string;
  ownerEmail: string;
  ownerPhone: string;
  facilityName: string;
  facilityImageUrl: string;
  facilityAddress: string;
  facilityProvinceCode: string;
  facilityWardCode: string;
  facilityProvinceName: string;
  facilityWardName: string;
  mode: "buy" | "rent";
  quantity: number;
  unitPrice: number;
  buyPrice: number;
  rentPrice: number;
  rentalDates?: { start: Date; end: Date };
  rentUnit?: "HOUR" | "DAY" | "WEEK" | "MONTH";
  catalogStock: number;
  availableQuantity: number | null;
  inventoryTracked: boolean;
};

function resolveFacility(
  detail: ListingPublicDetailResponse,
  facilityOverride?: FacilityResponse | null,
): FacilityResponse | null {
  const fromListing = detail.facility as FacilityResponse | null | undefined;
  const base = facilityOverride ?? fromListing;
  if (!base?.id?.trim()) return null;
  const ownerId = base.ownerId?.trim() || detail.product?.ownerId?.trim() || "";
  return { ...base, ownerId };
}

export function buildCheckoutLineItem(
  input: CheckoutLineInput,
  detail: ListingPublicDetailResponse,
  availability: { tracked: boolean; availableQuantity: number | null },
  facilityOverride?: FacilityResponse | null,
): CheckoutLineItem | null {
  const row = findListingVariantRow(detail, input.listingVariantId);
  if (!row) return null;

  const { listing, product } = detail;
  const rentUnit = row.lv.rentUnit ?? undefined;
  const facility = resolveFacility(detail, facilityOverride);
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
    lineId: input.cartItemId ?? `${input.listingVariantId}:${input.mode}`,
    cartItemId: input.cartItemId,
    listingId: input.listingId,
    listingVariantId: input.listingVariantId,
    name,
    images: images.length > 0 ? images : ["https://images.unsplash.com/photo-1542838132-92c53300491e?w=480&h=480&fit=crop"],
    facilityId: facility?.id?.trim() ?? "",
    facilityOwnerId: facility?.ownerId?.trim() ?? "",
    ownerDisplayName: "",
    ownerEmail: "",
    ownerPhone: "",
    facilityName: facility?.name?.trim() ?? "",
    facilityImageUrl: facility?.imageUrl?.trim() ?? "",
    facilityAddress: facility?.address?.trim() ?? "",
    facilityProvinceCode: facility?.provinceCode?.trim() ?? "",
    facilityWardCode: facility?.wardCode?.trim() ?? "",
    facilityProvinceName: "",
    facilityWardName: "",
    mode: input.mode,
    quantity: input.quantity,
    unitPrice,
    buyPrice: input.mode === "buy" ? unitPrice : 0,
    rentPrice: input.mode === "rent" ? unitPrice : 0,
    rentalDates,
    rentUnit: input.mode === "rent" ? (input.rentUnit ?? rentUnit) : undefined,
    catalogStock,
    availableQuantity: availability.availableQuantity,
    inventoryTracked: availability.tracked,
  };
}
