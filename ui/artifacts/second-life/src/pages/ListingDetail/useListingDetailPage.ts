import { useMemo } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { fetchListingPublicDetail, type ListingItemResponse } from "@/api/listing";
import { useCategories } from "@/hooks/use-categories";
import { useAuth } from "@/context/AuthContext";
import { listingDetailToCartProduct, deriveListingCartPrices } from "./cart-adapter";
import {
  attributesWithDistinctValues,
  collectImageUrls,
  findParentCategoryId,
  mergeVariantRows,
} from "./listing-detail-utils";
import { SIMILAR_PAGE_SIZE } from "./constants";
import {
  buildSimilarListingSearchPlans,
  fetchSimilarListingsInfinitePage,
  similarListingNextPageParam,
  type SimilarListingPageParam,
} from "./similar-listings-search";

export function useListingDetailPage(listingId: string) {
  const { user } = useAuth();
  const similarProfileId = user?.id?.trim() ? user.id : undefined;

  const { data, isLoading, error } = useQuery({
    queryKey: ["listingPublicDetail", listingId],
    queryFn: () => fetchListingPublicDetail(listingId),
    enabled: Boolean(listingId),
  });

  const { data: categoriesData } = useCategories();

  const subId = data?.product.primarySubCategory?.id ?? null;

  const categoryIdForSimilar = useMemo(
    () => findParentCategoryId(categoriesData, subId),
    [categoriesData, subId],
  );

  const similarSearchPlans = useMemo(() => {
    if (!data) return null;
    const f = data.facility;
    return buildSimilarListingSearchPlans({
      productName: data.product.name,
      provinceCode: f?.provinceCode,
      wardCode: f?.wardCode,
      listingType: data.listing.listingType,
      categoryIdForSimilar,
      subId,
    });
  }, [data, categoryIdForSimilar, subId]);

  const similarExcludeIds = useMemo(() => new Set(listingId ? [listingId] : []), [listingId]);

  const similarInfinite = useInfiniteQuery({
    queryKey: [
      "listingSimilarInfinite",
      listingId,
      similarProfileId ?? "",
      similarSearchPlans?.map((plan) =>
        [
          plan.keyword ?? "",
          plan.provinceCode ?? "",
          plan.wardCode ?? "",
          plan.listingType,
          (plan.categoryIds ?? []).join(","),
          (plan.subCategoryIds ?? []).join(","),
        ].join("|"),
      ).join(";") ?? "",
    ],
    initialPageParam: { page: 0, planIndex: 0 } satisfies SimilarListingPageParam,
    enabled: Boolean(listingId && data && similarSearchPlans?.length),
    queryFn: async ({ pageParam }) =>
      fetchSimilarListingsInfinitePage(similarSearchPlans!, pageParam, {
        pageSize: SIMILAR_PAGE_SIZE,
        profileId: similarProfileId,
        excludeIds: similarExcludeIds,
      }),
    getNextPageParam: (lastPage, _pages, lastParam) =>
      similarListingNextPageParam(lastPage, lastParam, SIMILAR_PAGE_SIZE),
  });

  const similarItems = useMemo(() => {
    const dedup = new Map<string, ListingItemResponse>();
    for (const page of similarInfinite.data?.pages ?? []) {
      for (const row of page.items) dedup.set(row.id, row);
    }
    return [...dedup.values()];
  }, [similarInfinite.data?.pages]);

  const showSimilarBlock = Boolean(data && similarSearchPlans?.length);

  const images = useMemo(() => (data ? collectImageUrls(data) : []), [data]);
  const rows = useMemo(() => (data ? mergeVariantRows(data) : []), [data]);

  const specAttributes = useMemo(
    () => (data?.product.attributes ? attributesWithDistinctValues(data.product.attributes) : []),
    [data],
  );

  const totalStock = useMemo(
    () =>
      rows.reduce((s, { lv }) => {
        const q = lv?.quantity;
        return s + (typeof q === "number" && Number.isFinite(q) ? q : 0);
      }, 0),
    [rows],
  );

  const locationLine = useMemo(() => {
    if (!data?.facility) return "";
    const f = data.facility;
    return [f.address, f.wardCode, f.provinceCode].filter(Boolean).join(", ");
  }, [data]);

  const { buyPrice, rentPrice } = useMemo(
    () => (data ? deriveListingCartPrices(data) : { buyPrice: 0, rentPrice: 0 }),
    [data],
  );

  const cartBridge = useMemo(() => {
    if (!data || !listingId) return null;
    return listingDetailToCartProduct(data, {
      images,
      buyPrice,
      rentPrice,
      stock: totalStock,
      location: locationLine || "—",
    });
  }, [data, listingId, images, buyPrice, rentPrice, totalStock, locationLine]);

  return {
    data,
    isLoading,
    error,
    images,
    specAttributes,
    totalStock,
    locationLine,
    buyPrice,
    rentPrice,
    cartBridge,
    similarInfinite,
    similarItems,
    showSimilarBlock,
    subId,
  };
}
