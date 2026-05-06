import type { Product } from "@/lib/mock-data";
import type { ListingPublicDetailResponse } from "@/api/listing";

function mergeListingVariantPairs(detail: ListingPublicDetailResponse) {
  const variantById = new Map((detail.product.variants ?? []).map((v) => [v.id, v]));
  return (detail.listing.variants ?? [])
    .filter((lv) => lv.isActive !== false)
    .map((lv) => ({ lv, pv: variantById.get(lv.productVariantId) }));
}

export function deriveListingCartPrices(detail: ListingPublicDetailResponse): {
  buyPrice: number;
  rentPrice: number;
} {
  const { listing } = detail;
  const pairs = mergeListingVariantPairs(detail);
  if (listing.listingType === "BUY") {
    let buyPrice = listing.minPrice ?? 0;
    if (!buyPrice) {
      const ns = pairs.map(({ lv }) => lv.buyPrice).filter((n): n is number => n != null && n > 0);
      buyPrice = ns.length ? Math.min(...ns) : 0;
    }
    return { buyPrice, rentPrice: 0 };
  }
  let rentPrice = listing.minPrice ?? 0;
  if (!rentPrice) {
    const ns = pairs.map(({ lv }) => lv.rentPrice).filter((n): n is number => n != null && n > 0);
    rentPrice = ns.length ? Math.min(...ns) : 0;
  }
  return { buyPrice: 0, rentPrice };
}

export function listingDetailToCartProduct(
  detail: ListingPublicDetailResponse,
  ctx: { images: string[]; buyPrice: number; rentPrice: number; stock: number; location: string },
): Product {
  const { listing, product, facility } = detail;
  const sub = product.primarySubCategory;
  const type =
    listing.listingType === "RENT" ? "rent" : listing.listingType === "BUY" ? "buy" : "both";
  const rating =
    facility?.averageRating != null && facility.averageRating > 0
      ? Number(facility.averageRating)
      : 4.5;

  return {
    id: listing.id,
    name: listing.title,
    description: (listing.description ?? product.description ?? "").trim() || product.name,
    images: ctx.images.length > 0 ? ctx.images : ["https://images.unsplash.com/photo-1542838132-92c53300491e?w=480&h=480&fit=crop"],
    type,
    buyPrice: ctx.buyPrice > 0 ? ctx.buyPrice : undefined,
    rentPrice: ctx.rentPrice > 0 ? ctx.rentPrice : undefined,
    categoryId: "",
    subCategoryId: sub?.id ?? "",
    subCategoryName: sub?.name ?? "Danh mục",
    condition: listing.listingType === "RENT" ? "Cho thuê" : "Đăng bán",
    location: ctx.location,
    stock: Math.max(0, Math.floor(ctx.stock)),
    rating,
    reviewsCount: 0,
    facilityId: facility?.id ?? "",
    createdAt: new Date().toISOString(),
  };
}
