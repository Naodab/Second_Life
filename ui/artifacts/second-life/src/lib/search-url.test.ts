import { describe, expect, it } from "vitest";
import { buildFreshSearchPath, searchPathsQueryEqual } from "./search-url";

describe("searchPathsQueryEqual", () => {
  it("treats legacy and canonical query keys as equal", () => {
    const pairs: [string, string][] = [
      ["/search?categoryId=1", "/search?categoryIds[]=1"],
      ["/search?wardCode=123", "/search?WardCode=123"],
      ["/search?provinceCode=79&wardCode=123", "/search?province=79&ward=123"],
      ["/search?listingType=buy", "/search?type=BUY"],
      ["/search?keyword=test", "/search?q=test"],
      ["/search", "/search?sortBy=UPDATED_AT_DESC"],
    ];
    for (const [a, b] of pairs) {
      expect(searchPathsQueryEqual(a, b), `${a} vs ${b}`).toBe(true);
    }
  });

  it("detects real filter differences", () => {
    expect(searchPathsQueryEqual("/search?categoryId=1", "/search?categoryId=2")).toBe(false);
    expect(searchPathsQueryEqual("/search?keyword=a", "/search?keyword=b")).toBe(false);
  });

  it("matches buildFreshSearchPath output for mixed legacy URLs", () => {
    const desired = buildFreshSearchPath({
      categoryId: "cat-1",
      wardCode: "ward-9",
      provinceCode: "79",
      listingType: "buy",
      keyword: "máy ảnh",
    });
    const legacy = "/search?categoryIds[]=cat-1&province=79&WardCode=ward-9&type=BUY&q=m%C3%A1y%20%E1%BA%A3nh";
    expect(searchPathsQueryEqual(desired, legacy)).toBe(true);
  });
});
