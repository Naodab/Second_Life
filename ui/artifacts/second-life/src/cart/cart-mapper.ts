import type { CartItemResponse } from "@/api/cart";
import type { RentUnit } from "@/api/listing";
import type { CartItemView } from "@/pages/Cart/cart-types";

export function mapCartApiToView(row: CartItemResponse): CartItemView {
  const type = row.mode === "BUY" ? "buy" : "rent";
  const title = (row.title ?? row.productName ?? "Sản phẩm").trim();
  const label = row.variantLabel?.trim();
  const name = label ? `${title} (${label})` : title;
  const images = row.thumbnailUrl?.trim() ? [row.thumbnailUrl.trim()] : [];

  let rentalDates: { start: Date; end: Date } | undefined;
  if (row.rentalStart && row.rentalEnd) {
    const start = new Date(row.rentalStart);
    const end = new Date(row.rentalEnd);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      rentalDates = { start, end };
    }
  }

  return {
    cartItemId: row.id,
    listingId: row.listingId,
    listingVariantId: row.listingVariantId,
    name,
    images,
    facilityId: row.facilityId?.trim() ?? "",
    buyPrice: row.buyPrice ?? 0,
    rentPrice: row.rentPrice ?? 0,
    stock: 99,
    type,
    quantity: row.quantity,
    rentalDates,
    rentUnit: (row.rentUnit ?? undefined) as RentUnit | undefined,
    addedAt: row.addedAt ?? new Date().toISOString(),
  };
}
