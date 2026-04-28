import { customFetch } from "@workspace/api-client-react";
import { unwrapApiData, type ApiResponseEnvelope } from "./types";

export type SubCategoryResponse = {
  id: string;
  name: string;
  description?: string | null;
  code?: string | null;
};

export type CategoryResponse = {
  id: string;
  name: string;
  description?: string | null;
  code?: string | null;
  items?: SubCategoryResponse[] | null;
};

export async function getAllCategories(): Promise<CategoryResponse[]> {
  const raw = await customFetch<ApiResponseEnvelope<CategoryResponse[]>>(`/api/v1/categories`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return unwrapApiData(raw);
}
