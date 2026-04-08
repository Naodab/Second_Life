package com.naodab.productservice.services;

import java.util.List;

import com.naodab.productservice.dto.request.SubCategoryCreateRequest;
import com.naodab.productservice.dto.response.SubCategoryResponse;

public interface SubCategoryService {
  SubCategoryResponse createSubCategory(SubCategoryCreateRequest request);

  SubCategoryResponse getSubCategoryById(String id);

  List<SubCategoryResponse> getAllSubCategories();

  List<SubCategoryResponse> getAllSubCategoriesByCategoryId(String categoryId);

  SubCategoryResponse getSubCategoryByName(String name);

  void deleteSubCategory(String id);
}
