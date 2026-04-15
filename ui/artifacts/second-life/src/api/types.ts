export type ApiResponseEnvelope<T> = {
  code?: number;
  message?: string | null;
  data: T;
};

export function unwrapApiData<T>(r: ApiResponseEnvelope<T>): T {
  return r.data;
}
