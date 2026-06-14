import { imageUrlToBase64, type AiSuggestPriceRequest } from "@/api/ai";
import type { AttributeDto, ListingType, RentUnit } from "@/api/listing";

const DEFAULT_SKIP_IMAGE_HOST = "unsplash.com";

export function attributeDtosToLines(attributes: AttributeDto[] | null | undefined): string[] {
  if (!attributes?.length) return [];
  const lines: string[] = [];
  for (const attr of attributes) {
    const name = (attr.name ?? "").trim();
    const values = (attr.attributeValues ?? [])
      .map((v) => (v.value ?? "").trim())
      .filter(Boolean);
    if (!name || values.length === 0) continue;
    lines.push(`${name}: ${values.join(", ")}`);
  }
  return lines;
}

export function isUsableProductImageUrl(url: string | null | undefined): url is string {
  const trimmed = url?.trim();
  return Boolean(trimmed && !trimmed.includes(DEFAULT_SKIP_IMAGE_HOST));
}

export async function loadProductImagesForAi(
  medias: { mediaUrl?: string | null; mediaType?: string | null; isThumbnail?: boolean | null }[] | null | undefined,
  fallbackThumb?: string | null,
  limit = 2,
): Promise<string[]> {
  const images: string[] = [];
  const urls = (medias ?? [])
    .filter((m) => (m.mediaType ?? "IMAGE") === "IMAGE" && isUsableProductImageUrl(m.mediaUrl))
    .sort((a, b) => Number(Boolean(b.isThumbnail)) - Number(Boolean(a.isThumbnail)))
    .map((m) => m.mediaUrl!.trim())
    .filter((url, i, arr) => arr.indexOf(url) === i)
    .slice(0, limit);

  for (const url of urls) {
    const b64 = await imageUrlToBase64(url);
    if (b64) images.push(b64);
  }

  if (images.length === 0 && isUsableProductImageUrl(fallbackThumb)) {
    const b64 = await imageUrlToBase64(fallbackThumb.trim());
    if (b64) images.push(b64);
  }

  return images;
}

export type BuildSuggestPriceInput = {
  productName: string;
  productDescription?: string | null;
  listingTitle?: string | null;
  listingDescription?: string | null;
  listingType: ListingType;
  variantLabel?: string | null;
  subCategoryNames?: string[];
  primarySubCategoryId?: string | null;
  subCategoryIds?: string[];
  attributeLines?: string[];
  manufactureYear?: number | null;
  rentUnit?: RentUnit | null;
  regionName?: string | null;
  currentListedPriceVnd?: number | null;
  images?: string[];
  imageUrls?: string[];
};

export function buildSuggestPriceRequest(input: BuildSuggestPriceInput): AiSuggestPriceRequest {
  const listingType = input.listingType === "RENT" ? "RENT" : "BUY";
  return {
    productName: input.productName.trim(),
    productDescription: input.productDescription?.trim() || undefined,
    listingTitle: input.listingTitle?.trim() || undefined,
    listingDescription: input.listingDescription?.trim() || undefined,
    listingType,
    variantLabel: input.variantLabel?.trim() || undefined,
    subCategoryNames: input.subCategoryNames?.length ? input.subCategoryNames : undefined,
    primarySubCategoryId: input.primarySubCategoryId?.trim() || undefined,
    subCategoryIds: input.subCategoryIds?.length ? input.subCategoryIds : undefined,
    attributeLines: input.attributeLines?.length ? input.attributeLines : undefined,
    manufactureYear: input.manufactureYear ?? undefined,
    rentUnit: listingType === "RENT" ? input.rentUnit ?? "DAY" : undefined,
    regionName: input.regionName?.trim() || undefined,
    currentListedPriceVnd:
      input.currentListedPriceVnd != null && input.currentListedPriceVnd > 0
        ? Math.round(input.currentListedPriceVnd)
        : undefined,
    images: input.images?.length ? input.images : undefined,
    imageUrls: !input.images?.length && input.imageUrls?.length ? input.imageUrls : undefined,
  };
}

export function confidenceLabelVi(confidence?: string | null): string {
  switch ((confidence ?? "").toUpperCase()) {
    case "HIGH":
      return "Cao";
    case "MEDIUM":
      return "Trung bình";
    case "LOW":
      return "Thấp";
    default:
      return confidence ?? "";
  }
}
