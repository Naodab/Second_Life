package com.naodab.productservice.dto.request;

import java.util.List;

import com.naodab.productservice.opensearch.OpenSearchSortBy;
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
  String keyword;
  String ownerId;
  List<String> categoryIds;
  List<String> subCategoryIds;
  OpenSearchSortBy sortBy;
  ProductStatus status;
  Integer page;
  Integer pageSize;
}
