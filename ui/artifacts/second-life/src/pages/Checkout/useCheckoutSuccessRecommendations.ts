import { useMemo } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { fetchListingPublicDetail, searchListings, type ListingItemResponse, type ListingType } from "@/api/listing";
import { useAuth } from "@/context/AuthContext";
import { useCategories } from "@/hooks/use-categories";
import { findParentCategoryId } from "@/pages/ListingDetail/listing-detail-utils";
import { SIMILAR_PAGE_SIZE } from "@/pages/ListingDetail/constants";
import type { CheckoutSuccessItem } from "./checkout-success-context";

export function useCheckoutSuccessRecommendations(
  anchor: CheckoutSuccessItem | null,
  excludeListingIds: string[],
) {
  const { user } = useAuth();
  const similarProfileId = user?.id?.trim() ? user.id : undefined;
  const excludeSet = useMemo(() => new Set(excludeListingIds), [excludeListingIds]);

  const { data: listingDetail } = useQuery({
    queryKey: ["checkoutSuccessListingDetail", anchor?.listingId, anchor?.listingVariantId] as const,
    queryFn: () =>
      fetchListingPublicDetail(anchor!.listingId, {
        listingVariantId: anchor!.listingVariantId,
      }),
    enabled: Boolean(anchor?.listingId && anchor?.listingVariantId),
    staleTime: 60_000,
  });

  const { data: categoriesData } = useCategories();

  const subId = listingDetail?.product.primarySubCategory?.id ?? null;

  const categoryIdForSimilar = useMemo(
    () => findParentCategoryId(categoriesData, subId),
    [categoriesData, subId],
  );

  const similarSearchKey = useMemo(() => {
    if (!anchor) return null;
    const kw = (listingDetail?.product.name ?? anchor.name).trim();
    const listingType: ListingType = anchor.mode === "rent" ? "RENT" : "BUY";
    return {
      keyword: kw.length >= 2 ? kw.slice(0, 200) : null,
      provinceCode: anchor.facilityProvinceCode?.trim() || null,
      wardCode: anchor.facilityWardCode?.trim() || null,
      listingType,
      categoryIds: categoryIdForSimilar ? [categoryIdForSimilar] : null,
      subCategoryIds: categoryIdForSimilar ? null : subId ? [subId] : null,
    };
  }, [anchor, listingDetail, categoryIdForSimilar, subId]);

  const similarInfinite = useInfiniteQuery({
    queryKey: [
      "checkoutSuccessSimilar",
      anchor?.listingId ?? "",
      similarProfileId ?? "",
      similarSearchKey?.keyword ?? "",
      similarSearchKey?.provinceCode ?? "",
      similarSearchKey?.wardCode ?? "",
      similarSearchKey?.listingType ?? "",
      (similarSearchKey?.categoryIds ?? []).join(","),
      (similarSearchKey?.subCategoryIds ?? []).join(","),
      [...excludeSet].sort().join(","),
    ],
    initialPageParam: 0,
    enabled: Boolean(anchor && similarSearchKey),
    queryFn: async ({ pageParam }) => {
      const base = similarSearchKey!;
      const res = await searchListings(
        {
          keyword: base.keyword,
          provinceCode: base.provinceCode,
          wardCode: base.wardCode,
          listingType: base.listingType,
          categoryIds: base.categoryIds,
          subCategoryIds: base.subCategoryIds,
          sortBy: base.keyword ? "RELEVANCE" : "UPDATED_AT_DESC",
          page: pageParam,
          pageSize: SIMILAR_PAGE_SIZE,
        },
        { profileId: similarProfileId },
      );
      const rawItems = Array.isArray(res.items) ? res.items : [];
      const totalCount = typeof res.totalCount === "number" ? res.totalCount : Number(res.totalCount) || 0;
      const items = rawItems.filter((r) => !excludeSet.has(r.id));
      return { items, totalCount };
    },
    getNextPageParam: (lastPage, _pages, lastParam) =>
      (lastParam + 1) * SIMILAR_PAGE_SIZE < lastPage.totalCount ? lastParam + 1 : undefined,
  });

  const similarItems = useMemo(() => {
    const dedup = new Map<string, ListingItemResponse>();
    for (const page of similarInfinite.data?.pages ?? []) {
      for (const row of page.items) {
        if (!excludeSet.has(row.id)) dedup.set(row.id, row);
      }
    }
    return [...dedup.values()];
  }, [similarInfinite.data?.pages, excludeSet]);

  const listingType = anchor?.mode === "rent" ? "RENT" : "BUY";

  return {
    listingType,
    similarInfinite,
    similarItems,
    showSimilarBlock: Boolean(anchor && similarSearchKey),
  };
}
