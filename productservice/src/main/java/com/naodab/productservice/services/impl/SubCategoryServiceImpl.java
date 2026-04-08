package com.naodab.productservice.services.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.productservice.dto.request.SubCategoryCreateRequest;
import com.naodab.productservice.dto.response.SubCategoryResponse;
import com.naodab.productservice.mapper.SubCategoryMapper;
import com.naodab.productservice.repositories.CategoryRepository;
import com.naodab.productservice.repositories.SubCategoryRepository;
import com.naodab.productservice.models.Category;
import com.naodab.productservice.models.SubCategory;
import com.naodab.productservice.services.SubCategoryService;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class SubCategoryServiceImpl implements SubCategoryService {
  CategoryRepository categoryRepository;
  SubCategoryRepository subCategoryRepository;
  SubCategoryMapper subCategoryMapper;

  @Transactional
  @Override
  public SubCategoryResponse createSubCategory(SubCategoryCreateRequest request) {
    SubCategory subCategory = subCategoryMapper.toSubCategory(request);

    if (subCategoryRepository.existsByName(subCategory.getName())) {
      throw new AppException(ErrorCode.SUB_CATEGORY_ALREADY_EXISTS);
    }

    String categoryId = request.getCategoryId();
    if (categoryId == null || categoryId.isBlank()) {
      throw new AppException(ErrorCode.CATEGORY_NOT_FOUND);
    }

    Category category = categoryRepository.findById(categoryId)
        .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
    subCategory.setCategory(category);

    subCategory = subCategoryRepository.save(subCategory);
    return subCategoryMapper.toSubCategoryResponse(subCategory);
  }

  @Override
  public SubCategoryResponse getSubCategoryById(String id) {
    if (id == null || id.isBlank()) {
      throw new AppException(ErrorCode.SUB_CATEGORY_NOT_FOUND);
    }

    return subCategoryRepository.findById(id)
        .map(subCategoryMapper::toSubCategoryResponse)
        .orElseThrow(() -> new AppException(ErrorCode.SUB_CATEGORY_NOT_FOUND));
  }

  @Override
  public List<SubCategoryResponse> getAllSubCategories() {
    return subCategoryRepository.findAll()
        .stream()
        .map(subCategoryMapper::toSubCategoryResponse)
        .toList();
  }

  @Override
  public SubCategoryResponse getSubCategoryByName(String name) {
    if (name == null || name.isBlank()) {
      throw new AppException(ErrorCode.SUB_CATEGORY_NOT_FOUND);
    }

    return subCategoryRepository.findByName(name)
        .map(subCategoryMapper::toSubCategoryResponse)
        .orElseThrow(() -> new AppException(ErrorCode.SUB_CATEGORY_NOT_FOUND));
  }

  @Override
  public void deleteSubCategory(String id) {
    if (id == null || id.isBlank()) {
      throw new AppException(ErrorCode.SUB_CATEGORY_NOT_FOUND);
    }

    subCategoryRepository.deleteById(id);
  }

  @Override
  public List<SubCategoryResponse> getAllSubCategoriesByCategoryId(String categoryId) {
    if (categoryId == null || categoryId.isBlank()) {
      throw new AppException(ErrorCode.CATEGORY_NOT_FOUND);
    }

    return subCategoryRepository.findByCategoryId(categoryId)
        .stream()
        .map(subCategoryMapper::toSubCategoryResponse)
        .toList();
  }

}
