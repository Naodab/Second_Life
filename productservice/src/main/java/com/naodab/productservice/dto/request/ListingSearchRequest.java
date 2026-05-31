package com.naodab.productservice.dto.request;

import java.util.List;

import org.springframework.util.StringUtils;

import com.naodab.productservice.elasticsearch.ElasticsearchSortBy;
import com.naodab.productservice.models.Listing.ListingStatus;
import com.naodab.productservice.models.Listing.ListingType;
import com.naodab.productservice.models.Product.ProductStatus;

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
public class ListingSearchRequest {
  String keyword;
  String facilityId;
  String productId;
  String provinceCode;
  String wardCode;
  Float latitude;
  Float longitude;
  Float radiusMeters;
  ElasticsearchSortBy sortBy;
  ProductStatus productStatus;
  ListingType listingType;
  ListingStatus listingStatus;

  String categoryId;
  String subCategoryId;

  List<String> categoryIds;
  List<String> subCategoryIds;

  Double priceMin;
  Double priceMax;

  Integer page;
  Integer pageSize;

  public void normalizeCategoryScope() {
    String resolvedSubCategoryId = pickFirstId(subCategoryId, subCategoryIds);
    String resolvedCategoryId = pickFirstId(categoryId, categoryIds);

    if (StringUtils.hasText(resolvedSubCategoryId)) {
      subCategoryId = resolvedSubCategoryId.trim();
      categoryId = null;
    } else if (StringUtils.hasText(resolvedCategoryId)) {
      categoryId = resolvedCategoryId.trim();
      subCategoryId = null;
    } else {
      categoryId = null;
      subCategoryId = null;
    }
    categoryIds = null;
    subCategoryIds = null;
  }

  private static String pickFirstId(String singular, List<String> plural) {
    if (StringUtils.hasText(singular)) {
      return singular.trim();
    }
    if (plural == null || plural.isEmpty()) {
      return null;
    }
    for (String raw : plural) {
      if (StringUtils.hasText(raw)) {
        return raw.trim();
      }
    }
    return null;
  }
}
