package com.naodab.productservice.mapper;

import org.springframework.stereotype.Component;

import com.naodab.productservice.dto.request.SubCategoryCreateRequest;
import com.naodab.productservice.dto.response.SubCategoryResponse;
import com.naodab.productservice.models.SubCategory;

@Component
public class SubCategoryMapper {
  public SubCategoryResponse toSubCategoryResponse(SubCategory subCategory) {
    return SubCategoryResponse.builder()
        .id(subCategory.getId())
        .name(subCategory.getName())
        .description(subCategory.getDescription())
        .build();
  }

  public SubCategory toSubCategory(SubCategoryCreateRequest request) {
    return SubCategory.builder()
        .name(request.getName())
        .description(request.getDescription())
        .build();
  }
}
