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

export type WardLonLatResponse = WardResponse & {
  province?: { code?: string; id?: number | string; name?: string } | null;
};

function parseLocationList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object" && "data" in raw) {
    const data = (raw as ApiResponseEnvelope<unknown>).data;
    return Array.isArray(data) ? (data as T[]) : [];
  }
  return [];
}

export async function getProvinces(request: ProvinceSearchRequest): Promise<ProvinceResponse[]> {
  const raw = await customFetch<unknown>(`/api/v1/provinces`, {
    method: "GET",
    query: {
      page: request.page,
      pageSize: request.pageSize,
      name: request.name,
    },
  });
  return parseLocationList<ProvinceResponse>(raw);
}

export async function getWards(request: WardSearchRequest): Promise<WardResponse[]> {
  const raw = await customFetch<unknown>(`/api/v1/wards`, {
    method: "GET",
    query: {
      page: request.page,
      pageSize: request.pageSize,
      name: request.name,
      provinceCode: request.provinceCode,
    },
  });
  return parseLocationList<WardResponse>(raw);
}

export async function getWardsByLonLat(lon: number, lat: number): Promise<WardLonLatResponse[]> {
  const raw = await customFetch<ApiResponseEnvelope<WardLonLatResponse[]>>(`/api/v1/wards/lon-lat`, {
    method: "GET",
    query: { lon, lat },
  });
  const data = unwrapApiData<WardLonLatResponse[]>(raw);
  return Array.isArray(data) ? data : [];
}
