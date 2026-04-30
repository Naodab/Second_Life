package com.naodab.productservice.dto.request;

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
public class ProductSearchRequest {
  public enum ProductSortBy {
    RELEVANCE,
    DISTANCE,
    UPDATED_AT_DESC,
    CREATED_AT_DESC
  }

  String keyword;
  String facilityId;
  String provinceCode;
  String wardCode;
  Float latitude;
  Float longitude;
  Float radiusMeters;
  ProductSortBy sortBy;
  ProductStatus status;
  Integer page;
  Integer pageSize;
}
