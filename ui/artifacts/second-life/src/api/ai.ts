import { customFetch } from "@workspace/api-client-react";
import { unwrapApiData, type ApiResponseEnvelope } from "./types";

export type AiDescriptionRequest = {
  productName: string;
  subCategoryNames?: string[];
  attributeValues?: string[];
  imageUrls?: string[];
  listingType?: "BUY" | "RENT";
};

export type AiDescriptionResponse = {
  description: string;
};

export type AiAttributeValueRef = {
  attributeId: string;
  attributeValueId: string;
};

export type AiAnalyzeResponse = {
  name?: string | null;
  description?: string | null;
  categoryIds?: string[] | null;
  subCategoryIds?: string[] | null;
  attributeValues?: AiAttributeValueRef[] | null;
};

export type AiSuggestPriceRequest = {
  productName: string;
  productDescription?: string;
  listingTitle?: string;
  listingDescription?: string;
  listingType: "BUY" | "RENT";
  variantLabel?: string;
  subCategoryNames?: string[];
  attributeLines?: string[];
  manufactureYear?: number;
  rentUnit?: "HOUR" | "DAY" | "WEEK" | "MONTH";
  regionName?: string;
  /** Seller's current asking price — AI compares in reasoning */
  currentListedPriceVnd?: number;
  /** Base64 JPEG (no data-URL prefix) — preferred for Gemini vision */
  images?: string[];
  /** Fallback: server fetches URLs when images omitted */
  imageUrls?: string[];
};

export type AiSuggestPriceResponse = {
  suggestedPriceVnd?: number | null;
  priceMinVnd?: number | null;
  priceMaxVnd?: number | null;
  confidence?: string | null;
  reasoningBrief?: string | null;
  listingType?: string | null;
  rentUnit?: string | null;
};

export async function generateAiDescription(body: AiDescriptionRequest): Promise<AiDescriptionResponse> {
  const res = await customFetch<ApiResponseEnvelope<AiDescriptionResponse>>("/api/v1/ai/generate-description", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return unwrapApiData(res);
}

export async function imageUrlToBase64(url: string, maxPx = 768, quality = 0.75): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    const file = new File([blob], "product.jpg", { type: blob.type || "image/jpeg" });
    return resizeToBase64(file, maxPx, quality);
  } catch {
    return null;
  }
}

async function resizeToBase64(file: File, maxPx = 768, quality = 0.75): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = new OffscreenCanvas(w, h);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  const blob = await canvas.convertToBlob({ type: "image/jpeg", quality });
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function suggestAiPrice(body: AiSuggestPriceRequest): Promise<AiSuggestPriceResponse> {
  const res = await customFetch<ApiResponseEnvelope<AiSuggestPriceResponse>>("/api/v1/ai/suggest-price", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return unwrapApiData(res);
}

export async function analyzeProductImages(images: File[]): Promise<AiAnalyzeResponse> {
  const base64Images = await Promise.all(images.slice(0, 2).map((f) => resizeToBase64(f)));

  const res = await customFetch<ApiResponseEnvelope<AiAnalyzeResponse>>("/api/v1/ai/analyze-product", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ images: base64Images }),
  });
  return unwrapApiData(res);
}
