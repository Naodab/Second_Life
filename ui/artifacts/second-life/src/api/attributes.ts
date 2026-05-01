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
  attributeValues?: AttributeValueResponse[] | null;
};

export async function getAllAttributes(): Promise<AttributeResponse[]> {
  try {
    const raw = await customFetch<ApiResponseEnvelope<AttributeResponse[]>>(`/api/v1/attributes`, {
      method: "GET",
    });
    return unwrapApiData(raw);
  } catch {
    // Some environments route only the trailing-slash path.
    const fallbackRaw = await customFetch<ApiResponseEnvelope<AttributeResponse[]>>(`/api/v1/attributes/`, {
      method: "GET",
    });
    return unwrapApiData(fallbackRaw);
  }
}
