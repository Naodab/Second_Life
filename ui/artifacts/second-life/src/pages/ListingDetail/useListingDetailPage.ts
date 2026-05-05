import { useMemo } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { fetchListingPublicDetail, searchListings, type ListingItemResponse } from "@/api/listing";
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

  const similarSearchKey = useMemo(() => {
    if (!data) return null;
    const kw = (data.product.name ?? "").trim();
    const f = data.product.facility;
    return {
      keyword: kw.length >= 2 ? kw.slice(0, 200) : null,
      provinceCode: f?.provinceCode?.trim() || null,
      wardCode: f?.wardCode?.trim() || null,
      listingType: data.listing.listingType,
      categoryIds: categoryIdForSimilar ? [categoryIdForSimilar] : null,
      subCategoryIds: categoryIdForSimilar ? null : subId ? [subId] : null,
    };
  }, [data, categoryIdForSimilar, subId]);

  const similarInfinite = useInfiniteQuery({
    queryKey: [
      "listingSimilarInfinite",
      listingId,
      similarProfileId ?? "",
      similarSearchKey?.keyword ?? "",
      similarSearchKey?.provinceCode ?? "",
      similarSearchKey?.wardCode ?? "",
      similarSearchKey?.listingType ?? "",
      (similarSearchKey?.categoryIds ?? []).join(","),
      (similarSearchKey?.subCategoryIds ?? []).join(","),
    ],
    initialPageParam: 0,
    enabled: Boolean(listingId && data && similarSearchKey),
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
      const items = rawItems.filter((r) => r.id !== listingId);
      return { items, totalCount };
    },
    getNextPageParam: (lastPage, _pages, lastParam) =>
      (lastParam + 1) * SIMILAR_PAGE_SIZE < lastPage.totalCount ? lastParam + 1 : undefined,
  });

  const similarItems = useMemo(() => {
    const dedup = new Map<string, ListingItemResponse>();
    for (const page of similarInfinite.data?.pages ?? []) {
      for (const row of page.items) dedup.set(row.id, row);
    }
    return [...dedup.values()];
  }, [similarInfinite.data?.pages]);

  const showSimilarBlock = Boolean(data && similarSearchKey);

  const images = useMemo(() => (data ? collectImageUrls(data) : []), [data]);
  const rows = useMemo(() => (data ? mergeVariantRows(data) : []), [data]);

  const specAttributes = useMemo(
    () => (data?.product.attributes ? attributesWithDistinctValues(data.product.attributes) : []),
    [data],
  );

  const totalStock = useMemo(
    () =>
      rows.reduce((s, { pv }) => {
        const q = pv?.quantity;
        return s + (typeof q === "number" && Number.isFinite(q) ? q : 0);
      }, 0),
    [rows],
  );

  const locationLine = useMemo(() => {
    if (!data?.product.facility) return "";
    const f = data.product.facility;
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
