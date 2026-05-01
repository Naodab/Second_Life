package com.naodab.productservice.dto.response;

import java.time.LocalDateTime;

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
public class ProductItemResponse {
  String id;
  String name;
  String thumbnailImage;
  ProductStatus status;

  String primarySubCategoryName;

  String primarySubCategoryId;

  int variantCount;

  LocalDateTime createdAt;
}
