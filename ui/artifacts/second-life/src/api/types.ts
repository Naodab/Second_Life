export type PagedItemsResponse<T> = {
  page: number;
  pageSize: number;
  totalCount: number;
  items: T[];
};

export type ApiResponseEnvelope<T> = {
  code?: number;
  message?: string | null;
  data: T;
};

export function unwrapApiData<T>(r: ApiResponseEnvelope<T>): T {
  return r.data;
}
