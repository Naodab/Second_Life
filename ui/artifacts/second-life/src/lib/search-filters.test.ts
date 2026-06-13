import { describe, expect, it } from "vitest";
import {
  buildSearchFiltersPath,
  parseSearchFilters,
  searchFiltersEqual,
  searchQueryMatchesPath,
} from "./search-filters";

describe("search-filters", () => {
  it("parses legacy query keys into canonical filter shape", () => {
    const filters = parseSearchFilters(
      "?categoryIds[]=cat-1&province=79&WardCode=ward-9&type=BUY&q=m%C3%A1y%20%E1%BA%A3nh",
    );
    expect(filters).toMatchObject({
      listingType: "buy",
      categoryId: "cat-1",
      provinceCode: "79",
      wardCode: "ward-9",
      keyword: "máy ảnh",
    });
  });

  it("builds paths that match legacy URLs", () => {
    const path = buildSearchFiltersPath({
      listingType: "buy",
      categoryId: "cat-1",
      provinceCode: "79",
      wardCode: "ward-9",
      keyword: "máy ảnh",
      sortBy: "UPDATED_AT_DESC",
    });
    const legacy = "/search?categoryIds[]=cat-1&province=79&WardCode=ward-9&type=BUY&q=m%C3%A1y%20%E1%BA%A3nh";
    expect(searchQueryMatchesPath("?categoryIds[]=cat-1&province=79&WardCode=ward-9&type=BUY&q=m%C3%A1y%20%E1%BA%A3nh", path)).toBe(true);
    expect(searchQueryMatchesPath(legacy.split("?")[1] ?? "", path)).toBe(true);
  });

  it("detects filter equality", () => {
    const a = parseSearchFilters("?keyword=test&listingType=buy");
    const b = parseSearchFilters("?q=test&type=BUY");
    expect(searchFiltersEqual(a, b)).toBe(true);
  });
});
