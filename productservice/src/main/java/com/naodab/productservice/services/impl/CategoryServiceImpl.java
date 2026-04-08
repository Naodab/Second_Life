package com.naodab.productservice.services.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.productservice.dto.request.CategoryCreateRequest;
import com.naodab.productservice.dto.response.CategoryResponse;
import com.naodab.productservice.mapper.CategoryMapper;
import com.naodab.productservice.models.Category;
import com.naodab.productservice.repositories.CategoryRepository;
import com.naodab.productservice.services.CategoryService;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class CategoryServiceImpl implements CategoryService {
  CategoryRepository categoryRepository;
  CategoryMapper categoryMapper;

  @Override
  public CategoryResponse createCategory(CategoryCreateRequest request) {
    Category category = categoryMapper.toCategory(request);

    if (categoryRepository.existsByName(category.getName())) {
      throw new AppException(ErrorCode.CATEGORY_ALREADY_EXISTS);
    }

    category = categoryRepository.save(category);
    return categoryMapper.toCategoryResponse(category);
  }

  @Override
  public CategoryResponse getCategoryById(String id) {
    if (id == null || id.isBlank()) {
      throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
    }

    return categoryRepository.findById(id)
        .map(categoryMapper::toCategoryResponse)
        .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
  }

  @Override
  public List<CategoryResponse> getAllCategories() {
    return categoryRepository.findAll()
        .stream()
        .map(categoryMapper::toCategoryResponse)
        .toList();
  }

  @Override
  public CategoryResponse getCategoryByName(String name) {
    if (name == null || name.isBlank()) {
      throw new AppException(ErrorCode.CATEGORY_NOT_FOUND);
    }

    return categoryRepository.findByName(name)
        .map(categoryMapper::toCategoryResponse)
        .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
  }

  @Override
  public void deleteCategory(String id) {
    if (id == null || id.isBlank()) {
      throw new AppException(ErrorCode.CATEGORY_NOT_FOUND);
    }

    categoryRepository.deleteById(id);
  }
}
