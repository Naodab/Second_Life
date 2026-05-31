package com.naodab.productservice.dto.search;

import java.util.List;
import java.util.Objects;

import org.springframework.util.StringUtils;

import com.naodab.productservice.dto.request.ListingSearchRequest;
import com.naodab.productservice.models.Listing.ListingType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class SearchHistorySnapshot {
  String keyword;

  List<String> categoryIds;
  List<String> subCategoryIds;

  ListingType listingType;

  Double priceMin;
  Double priceMax;

  String provinceCode;
  String wardCode;

  public static SearchHistorySnapshot fromNormalizedSearch(ListingSearchRequest r) {
    if (r == null) {
      return SearchHistorySnapshot.builder().build();
    }
    return SearchHistorySnapshot.builder()
        .keyword(r.getKeyword())
        .categoryIds(singleIdList(r.getCategoryId()))
        .subCategoryIds(singleIdList(r.getSubCategoryId()))
        .listingType(r.getListingType())
        .priceMin(r.getPriceMin())
        .priceMax(r.getPriceMax())
        .provinceCode(r.getProvinceCode())
        .wardCode(r.getWardCode())
        .build();
  }

  public boolean isWorthRecording() {
    if (StringUtils.hasText(keyword)) {
      return true;
    }
    if (categoryIds != null && !categoryIds.isEmpty()) {
      return true;
    }
    if (subCategoryIds != null && !subCategoryIds.isEmpty()) {
      return true;
    }
    if (listingType != null) {
      return true;
    }
    if (priceMin != null || priceMax != null) {
      return true;
    }
    if (StringUtils.hasText(provinceCode) || StringUtils.hasText(wardCode)) {
      return true;
    }
    return false;
  }

  private static List<String> singleIdList(String id) {
    if (!StringUtils.hasText(id)) {
      return null;
    }
    return List.of(id.trim());
  }

  public boolean contentEquals(SearchHistorySnapshot o) {
    if (o == null) {
      return false;
    }
    return Objects.equals(trimOrNull(keyword), trimOrNull(o.keyword))
        && listNullableEq(categoryIds, o.categoryIds)
        && listNullableEq(subCategoryIds, o.subCategoryIds)
        && listingType == o.listingType
        && Objects.equals(priceMin, o.priceMin)
        && Objects.equals(priceMax, o.priceMax)
        && Objects.equals(trimOrNull(provinceCode), trimOrNull(o.provinceCode))
        && Objects.equals(trimOrNull(wardCode), trimOrNull(o.wardCode));
  }

  private static String trimOrNull(String s) {
    return s == null || s.isBlank() ? null : s.trim();
  }

  private static boolean listNullableEq(List<String> a, List<String> b) {
    if (a == null && b == null) {
      return true;
    }
    if (a == null || b == null || a.size() != b.size()) {
      return false;
    }
    return a.equals(b);
  }
}
