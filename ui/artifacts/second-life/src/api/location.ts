import { customFetch } from "@workspace/api-client-react";
import { unwrapApiData, type ApiResponseEnvelope } from "./types";

export type ProvinceResponse = {
  id: string;
  code: string;
  name: string;
  fullName: string;
  codeName: string;
}

export type ProvinceSearchRequest = {
  name?: string;
  page?: number;
  pageSize?: number;
};

export type WardSearchRequest = {
  name?: string;
  provinceCode?: string;
  page?: number;
  pageSize?: number;
};

export type WardResponse = {
  id: string;
  code: string;
  name: string;
  fullName: string;
  codeName: string;
};

export async function getProvinces(request: ProvinceSearchRequest): Promise<ProvinceResponse[]> {
  const raw = await customFetch<ApiResponseEnvelope<ProvinceResponse[]>>(`/api/v1/provinces`, {
    method: "GET",
    query: {
      page: request.page,
      pageSize: request.pageSize,
      name: request.name,
    },
  });
  return unwrapApiData<ProvinceResponse[]>(raw);
}

export async function getWards(request: WardSearchRequest): Promise<WardResponse[]> {
  const raw = await customFetch<ApiResponseEnvelope<WardResponse[]>>(`/api/v1/wards`, {
    method: "GET",
    query: {
      page: request.page,
      pageSize: request.pageSize,
      name: request.name,
      provinceCode: request.provinceCode,
    },
  });
  return unwrapApiData<WardResponse[]>(raw);
}
