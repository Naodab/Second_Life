package com.naodab.productservice.dto.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import com.naodab.productservice.models.Product.ProductStatus;
import com.naodab.productservice.models.ProductMedia;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class ProductResponse {
  String id;

  String name;

  String description;

  Integer manufactureYear;

  String ownerId;

  String thumbnailUrl;

  CategoryResponse primarySubCategory;

  List<CategoryResponse> subCategories;

  List<AttributeResponse> attributes;

  List<ProductMedia> medias;

  List<ProductVariantSummaryResponse> variants;

  ProductStatus status;
}
