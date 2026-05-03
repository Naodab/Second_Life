package com.naodab.productservice.dto.request;

import java.util.List;

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
  /** When set (e.g. seller filters by product), matches listing document {@code productId} */
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

  List<String> categoryIds;
  List<String> subCategoryIds;

  Double priceMin;
  Double priceMax;

  Integer page;
  Integer pageSize;
}
