package com.naodab.productservice.controllers;

import java.util.List;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RestController;

import com.naodab.commonservice.constant.AppConstants;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.commonservice.response.ApiResponse;
import com.naodab.productservice.dto.request.SubCategoryCreateRequest;
import com.naodab.productservice.dto.response.SubCategoryResponse;
import com.naodab.productservice.services.SubCategoryService;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/sub-categories")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class SubCategoryController {
  SubCategoryService subCategoryService;

  @PostMapping
  public ResponseEntity<ApiResponse<SubCategoryResponse>> createSubCategory(
      @RequestHeader(value = AppConstants.JWT_CLAIM_ROLE, required = false) String role,
      @RequestBody @Valid SubCategoryCreateRequest request) {
    if (role != null && !role.equals(AppConstants.ROLE_ADMIN)) {
      throw new AppException(ErrorCode.FORBIDDEN);
    }
    return ResponseEntity.ok(
        ApiResponse.<SubCategoryResponse>builder()
            .data(subCategoryService.createSubCategory(request))
            .build());
  }

  @GetMapping("/{id}")
  public ResponseEntity<ApiResponse<SubCategoryResponse>> getSubCategoryById(@PathVariable String id) {
    return ResponseEntity.ok(
        ApiResponse.<SubCategoryResponse>builder()
            .data(subCategoryService.getSubCategoryById(id))
            .build());
  }

  @GetMapping
  public ResponseEntity<ApiResponse<List<SubCategoryResponse>>> getAllSubCategories() {
    return ResponseEntity.ok(
        ApiResponse.<List<SubCategoryResponse>>builder()
            .data(subCategoryService.getAllSubCategories())
            .build());
  }

  @GetMapping("/category/{categoryId}")
  public ResponseEntity<ApiResponse<List<SubCategoryResponse>>> getAllSubCategoriesByCategoryId(
      @PathVariable String categoryId) {
    return ResponseEntity.ok(
        ApiResponse.<List<SubCategoryResponse>>builder()
            .data(subCategoryService.getAllSubCategoriesByCategoryId(categoryId))
            .build());
  }

  @GetMapping("/name/{name}")
  public ResponseEntity<ApiResponse<SubCategoryResponse>> getSubCategoryByName(@PathVariable String name) {
    return ResponseEntity.ok(
        ApiResponse.<SubCategoryResponse>builder()
            .data(subCategoryService.getSubCategoryByName(name))
            .build());
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<ApiResponse<Void>> deleteSubCategory(
      @RequestHeader(value = AppConstants.JWT_CLAIM_ROLE, required = false) String role,
      @PathVariable String id) {
    if (role != null && !role.equals(AppConstants.ROLE_ADMIN)) {
      throw new AppException(ErrorCode.FORBIDDEN);
    }
    subCategoryService.deleteSubCategory(id);
    return ResponseEntity.ok(
        ApiResponse.<Void>builder()
            .data(null)
            .build());
  }
}
