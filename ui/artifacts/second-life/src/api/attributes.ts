import { customFetch } from "@workspace/api-client-react";
import { unwrapApiData, type ApiResponseEnvelope } from "./types";

export type AttributeValueResponse = {
  id: string;
  value: string;
  code?: string | null;
};

export type AttributeResponse = {
  id: string;
  name: string;
  subCategoryIds?: string[] | null;
  attributeValues?: AttributeValueResponse[] | null;
};

export async function getAllAttributes(subCategoryId?: string | null): Promise<AttributeResponse[]> {
  const query = subCategoryId?.trim()
    ? `?subCategoryId=${encodeURIComponent(subCategoryId.trim())}`
    : "";
  try {
    const raw = await customFetch<ApiResponseEnvelope<AttributeResponse[]>>(`/api/v1/attributes${query}`, {
      method: "GET",
    });
    return unwrapApiData(raw);
  } catch {
    const fallbackRaw = await customFetch<ApiResponseEnvelope<AttributeResponse[]>>(
      `/api/v1/attributes${query || "/"}`,
      { method: "GET" },
    );
    return unwrapApiData(fallbackRaw);
  }
}
