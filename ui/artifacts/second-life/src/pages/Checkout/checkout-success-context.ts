import type { CheckoutLineItem } from "@/checkout/build-checkout-line";

export type CheckoutSuccessItem = {
  listingId: string;
  listingVariantId: string;
  name: string;
  images: string[];
  mode: "buy" | "rent";
  facilityProvinceCode: string;
  facilityWardCode: string;
};

export type CheckoutSuccessContext = {
  items: CheckoutSuccessItem[];
  subOrderCount: number;
};

export function buildCheckoutSuccessContext(
  items: CheckoutLineItem[],
  subOrderCount: number,
): CheckoutSuccessContext {
  return {
    subOrderCount,
    items: items.map((item) => ({
      listingId: item.listingId,
      listingVariantId: item.listingVariantId,
      name: item.name,
      images: item.images,
      mode: item.mode,
      facilityProvinceCode: item.facilityProvinceCode,
      facilityWardCode: item.facilityWardCode,
    })),
  };
}
