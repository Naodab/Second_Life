import { useQuery } from "@tanstack/react-query";
import { getAllCategories } from "@/api/categories";

export const categoriesQueryKey = ["categories"] as const;

export function useCategories() {
  return useQuery({
    queryKey: categoriesQueryKey,
    queryFn: getAllCategories,
    staleTime: 1000 * 60 * 30,
  });
}
