import { describe, expect, it } from "vitest";
import { buildSimilarListingSearchPlans } from "./similar-listings-search";

describe("buildSimilarListingSearchPlans", () => {
  it("starts with keyword search then falls back to category and location", () => {
    const plans = buildSimilarListingSearchPlans({
      productName: "iPhone 13",
      provinceCode: "79",
      wardCode: "27127",
      listingType: "BUY",
      categoryIdForSimilar: "cat-phone",
      subId: "sub-phone",
    });

    expect(plans).toHaveLength(3);
    expect(plans[0]).toMatchObject({
      keyword: "iPhone 13",
      provinceCode: "79",
      wardCode: "27127",
      categoryIds: ["cat-phone"],
      subCategoryIds: null,
    });
    expect(plans[1]).toMatchObject({
      keyword: null,
      provinceCode: "79",
      wardCode: "27127",
    });
    expect(plans[2]).toMatchObject({
      keyword: null,
      provinceCode: "79",
      wardCode: null,
    });
  });

  it("skips duplicate keyword plan when product name is too short", () => {
    const plans = buildSimilarListingSearchPlans({
      productName: "A",
      provinceCode: "79",
      wardCode: "27127",
      listingType: "BUY",
      categoryIdForSimilar: null,
      subId: "sub-phone",
    });

    expect(plans).toHaveLength(2);
    expect(plans[0].keyword).toBeNull();
    expect(plans[0].subCategoryIds).toEqual(["sub-phone"]);
    expect(plans[1].wardCode).toBeNull();
  });

  it("keeps province-only fallback when ward is missing", () => {
    const plans = buildSimilarListingSearchPlans({
      productName: "Samsung S23",
      provinceCode: "01",
      wardCode: null,
      listingType: "RENT",
      categoryIdForSimilar: "cat-phone",
      subId: null,
    });

    expect(plans).toHaveLength(2);
    expect(plans[0].keyword).toBe("Samsung S23");
    expect(plans[1]).toMatchObject({
      keyword: null,
      provinceCode: "01",
      wardCode: null,
    });
  });
});
