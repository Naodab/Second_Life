package com.naodab.productservice.services;

import java.util.List;

import com.naodab.productservice.dto.request.CategoryCreateRequest;
import com.naodab.productservice.dto.response.CategoryResponse;

public interface CategoryService {
  CategoryResponse createCategory(CategoryCreateRequest request);

  CategoryResponse getCategoryById(String id);

  List<CategoryResponse> getAllCategories();

  CategoryResponse getCategoryByName(String name);

  void deleteCategory(String id);
}
