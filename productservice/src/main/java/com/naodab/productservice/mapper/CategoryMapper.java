package com.naodab.productservice.mapper;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.naodab.productservice.dto.request.CategoryCreateRequest;
import com.naodab.productservice.dto.response.CategoryResponse;
import com.naodab.productservice.models.Category;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class CategoryMapper {
  SubCategoryMapper subCategoryMapper;

  public CategoryResponse toCategoryResponse(Category category) {
    return CategoryResponse.builder()
        .id(category.getId())
        .name(category.getName())
        .description(category.getDescription())
        .items(category.getSubCategories() == null ? List.of()
            : category.getSubCategories().stream().map(subCategoryMapper::toSubCategoryResponse).toList())
        .build();
  }

  public Category toCategory(CategoryCreateRequest request) {
    return Category.builder()
        .id(UUID.randomUUID().toString())
        .name(request.getName())
        .description(request.getDescription())
        .build();
  }

}
