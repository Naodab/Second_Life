package com.naodab.productservice.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;
import jakarta.validation.Valid;

import com.naodab.commonservice.constant.AppConstants;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.commonservice.response.ApiResponse;
import com.naodab.productservice.dto.request.ProductCreateRequest;
import com.naodab.productservice.dto.request.ProductUpdateRequest;
import com.naodab.productservice.dto.request.UploadProductImagesRequest;
import com.naodab.productservice.dto.response.ProductResponse;
import com.naodab.productservice.services.ProductService;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class ProductController {
  ProductService productService;

  @PostMapping
  public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
      @RequestHeader(value = AppConstants.JWT_CLAIM_ROLE, required = false) String role,
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader,
      @RequestBody @Valid ProductCreateRequest request) {
    String profileId = validateProfileId(profileIdHeader);
    return ResponseEntity.ok(ApiResponse.<ProductResponse>builder()
        .data(productService.createProduct(profileId, request))
        .build());
  }

  @PutMapping("/{id}")
  public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
      @PathVariable String id,
      @RequestHeader(value = AppConstants.JWT_CLAIM_ROLE, required = false) String role,
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader,
      @RequestBody @Valid ProductUpdateRequest request) {
    String profileId = validateProfileId(profileIdHeader);
    return ResponseEntity.ok(ApiResponse.<ProductResponse>builder()
        .data(productService.updateProduct(profileId, id, request))
        .build());
  }

  @PostMapping("/{id}/images")
  public ResponseEntity<ApiResponse<Void>> uploadProductImages(
      @PathVariable String id,
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader,
      @RequestBody @Valid UploadProductImagesRequest request) {
    String profileId = validateProfileId(profileIdHeader);
    productService.uploadProductImages(profileId, id, request.getThumbnailUrl(), request.getProductImageUrls());
    return ResponseEntity.ok(ApiResponse.<Void>builder().build());
  }

  private String validateProfileId(String profileIdHeader) {
    if (profileIdHeader == null || profileIdHeader.isBlank()) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    return profileIdHeader.trim();
  }
}
