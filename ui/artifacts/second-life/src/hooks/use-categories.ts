import { useQuery } from "@tanstack/react-query";
import type { CategoryResponse } from "@/api/categories";
import { getAllCategories } from "@/api/categories";

export const categoriesQueryKey = ["categories"] as const;

const EMPTY_CATEGORIES: CategoryResponse[] = [];

export function useCategories() {
  const query = useQuery({
    queryKey: categoriesQueryKey,
    queryFn: getAllCategories,
    staleTime: 1000 * 60 * 30,
  });
  return {
    ...query,
    data: query.data ?? EMPTY_CATEGORIES,
  };
}
