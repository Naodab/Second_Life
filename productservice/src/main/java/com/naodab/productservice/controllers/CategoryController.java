package com.naodab.productservice.controllers;

import java.util.List;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.http.ResponseEntity;
import jakarta.validation.Valid;

import com.naodab.commonservice.constant.AppConstants;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.commonservice.response.ApiResponse;
import com.naodab.productservice.dto.request.CategoryCreateRequest;
import com.naodab.productservice.dto.response.CategoryResponse;
import com.naodab.productservice.dto.response.SubCategoryResponse;
import com.naodab.productservice.services.CategoryService;
import com.naodab.productservice.services.SubCategoryService;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class CategoryController {
  CategoryService categoryService;
  SubCategoryService subCategoryService;

  @PostMapping
  public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
      @RequestHeader(value = AppConstants.JWT_CLAIM_ROLE, required = false) String role,
      @RequestBody @Valid CategoryCreateRequest request) {

    if (role != null && !role.equals(AppConstants.ROLE_ADMIN)) {
      throw new AppException(ErrorCode.FORBIDDEN);
    }

    return ResponseEntity.ok(
        ApiResponse.<CategoryResponse>builder()
            .data(categoryService.createCategory(request))
            .build());
  }

  @GetMapping("/{id}")
  public ResponseEntity<ApiResponse<CategoryResponse>> getCategoryById(@PathVariable String id) {
    return ResponseEntity.ok(
        ApiResponse.<CategoryResponse>builder()
            .data(categoryService.getCategoryById(id))
            .build());
  }

  @GetMapping
  public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories() {
    return ResponseEntity.ok(
        ApiResponse.<List<CategoryResponse>>builder()
            .data(categoryService.getAllCategories())
            .build());
  }

  @GetMapping("/name/{name}")
  public ResponseEntity<ApiResponse<CategoryResponse>> getCategoryByName(@PathVariable String name) {
    return ResponseEntity.ok(
        ApiResponse.<CategoryResponse>builder()
            .data(categoryService.getCategoryByName(name))
            .build());
  }

  @GetMapping("/sub-categories/{categoryId}")
  public ResponseEntity<ApiResponse<List<SubCategoryResponse>>> getAllSubCategoriesByCategoryId(
      @PathVariable String categoryId) {
    return ResponseEntity.ok(
        ApiResponse.<List<SubCategoryResponse>>builder()
            .data(subCategoryService.getAllSubCategoriesByCategoryId(categoryId))
            .build());
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<ApiResponse<Void>> deleteCategory(
      @RequestHeader(value = AppConstants.JWT_CLAIM_ROLE, required = false) String role, @PathVariable String id) {
    if (role != null && !role.equals(AppConstants.ROLE_ADMIN)) {
      throw new AppException(ErrorCode.FORBIDDEN);
    }
    categoryService.deleteCategory(id);
    return ResponseEntity.ok(
        ApiResponse.<Void>builder()
            .data(null)
            .build());
  }
}
