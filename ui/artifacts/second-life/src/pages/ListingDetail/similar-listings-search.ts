import { searchListings, type ListingItemResponse, type ListingType } from "@/api/listing";

export type SimilarListingSearchKey = {
  keyword: string | null;
  provinceCode: string | null;
  wardCode: string | null;
  listingType: ListingType;
  categoryIds: string[] | null;
  subCategoryIds: string[] | null;
};

export type SimilarListingPageParam = {
  page: number;
  planIndex: number;
};

export type SimilarListingPageResult = {
  items: ListingItemResponse[];
  totalCount: number;
  planIndex: number;
};

type BuildSimilarPlansInput = {
  productName: string | null | undefined;
  provinceCode: string | null | undefined;
  wardCode: string | null | undefined;
  listingType: ListingType;
  categoryIdForSimilar: string | null;
  subId: string | null;
};

function planSignature(plan: SimilarListingSearchKey): string {
  return [
    plan.keyword ?? "",
    plan.provinceCode ?? "",
    plan.wardCode ?? "",
    plan.listingType,
    (plan.categoryIds ?? []).join(","),
    (plan.subCategoryIds ?? []).join(","),
  ].join("|");
}

export function buildSimilarListingSearchPlans(input: BuildSimilarPlansInput): SimilarListingSearchKey[] {
  const kw = (input.productName ?? "").trim();
  const keyword = kw.length >= 2 ? kw.slice(0, 200) : null;
  const provinceCode = input.provinceCode?.trim() || null;
  const wardCode = input.wardCode?.trim() || null;
  const categoryIds = input.categoryIdForSimilar ? [input.categoryIdForSimilar] : null;
  const subCategoryIds = input.categoryIdForSimilar ? null : input.subId?.trim() ? [input.subId.trim()] : null;
  const base = {
    listingType: input.listingType,
    categoryIds,
    subCategoryIds,
  };

  const candidates: SimilarListingSearchKey[] = [
    { ...base, keyword, provinceCode, wardCode },
    { ...base, keyword: null, provinceCode, wardCode },
  ];

  if (wardCode && provinceCode) {
    candidates.push({ ...base, keyword: null, provinceCode, wardCode: null });
  }

  const seen = new Set<string>();
  const plans: SimilarListingSearchKey[] = [];
  for (const plan of candidates) {
    const sig = planSignature(plan);
    if (seen.has(sig)) continue;
    seen.add(sig);
    plans.push(plan);
  }

  return plans;
}

async function searchSimilarListingsPage(
  key: SimilarListingSearchKey,
  page: number,
  pageSize: number,
  profileId: string | undefined,
  excludeIds: Set<string>,
): Promise<{ items: ListingItemResponse[]; totalCount: number }> {
  const res = await searchListings(
    {
      keyword: key.keyword,
      provinceCode: key.provinceCode,
      wardCode: key.wardCode,
      listingType: key.listingType,
      categoryIds: key.categoryIds,
      subCategoryIds: key.subCategoryIds,
      sortBy: key.keyword ? "RELEVANCE" : "UPDATED_AT_DESC",
      page,
      pageSize,
    },
    { profileId },
  );
  const rawItems = Array.isArray(res.items) ? res.items : [];
  const totalCount = typeof res.totalCount === "number" ? res.totalCount : Number(res.totalCount) || 0;
  const items = rawItems.filter((row) => !excludeIds.has(row.id));
  return { items, totalCount };
}

export async function fetchSimilarListingsInfinitePage(
  plans: SimilarListingSearchKey[],
  pageParam: SimilarListingPageParam,
  options: {
    pageSize: number;
    profileId?: string;
    excludeIds: Set<string>;
  },
): Promise<SimilarListingPageResult> {
  if (plans.length === 0) {
    return { items: [], totalCount: 0, planIndex: 0 };
  }

  if (pageParam.page === 0) {
    for (let i = 0; i < plans.length; i++) {
      const result = await searchSimilarListingsPage(
        plans[i],
        0,
        options.pageSize,
        options.profileId,
        options.excludeIds,
      );
      const isLastPlan = i === plans.length - 1;
      if (result.items.length > 0 || isLastPlan) {
        return { ...result, planIndex: i };
      }
    }
  }

  const planIndex = Math.min(Math.max(pageParam.planIndex, 0), plans.length - 1);
  const result = await searchSimilarListingsPage(
    plans[planIndex],
    pageParam.page,
    options.pageSize,
    options.profileId,
    options.excludeIds,
  );
  return { ...result, planIndex };
}

export function similarListingNextPageParam(
  lastPage: SimilarListingPageResult,
  lastParam: SimilarListingPageParam,
  pageSize: number,
): SimilarListingPageParam | undefined {
  const nextPage = lastParam.page + 1;
  if (nextPage * pageSize < lastPage.totalCount) {
    return { page: nextPage, planIndex: lastPage.planIndex };
  }
  return undefined;
}
