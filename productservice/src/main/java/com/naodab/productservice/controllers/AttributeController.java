package com.naodab.productservice.controllers;

import java.util.List;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.naodab.commonservice.constant.AppConstants;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.productservice.services.AttributeService;
import com.naodab.productservice.dto.request.AttributeCreateRequest;
import com.naodab.productservice.dto.response.AttributeResponse;
import com.naodab.commonservice.response.ApiResponse;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/attributes")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AttributeController {
  AttributeService attributeService;

  @PostMapping
  public ResponseEntity<ApiResponse<AttributeResponse>> createAttribute(
      @RequestHeader(value = AppConstants.JWT_CLAIM_ROLE, required = false) String role,
      @RequestBody @Valid AttributeCreateRequest request) {

    if (role != null && !role.equals(AppConstants.ROLE_ADMIN)) {
      throw new AppException(ErrorCode.FORBIDDEN);
    }

    return ResponseEntity.ok(
        ApiResponse.<AttributeResponse>builder()
            .data(attributeService.createAttribute(request))
            .build());
  }

  @GetMapping("/{id}")
  public ResponseEntity<ApiResponse<AttributeResponse>> getAttributeById(@PathVariable String id) {
    return ResponseEntity.ok(
        ApiResponse.<AttributeResponse>builder()
            .data(attributeService.getAttributeById(id))
            .build());
  }

  @GetMapping
  public ResponseEntity<ApiResponse<List<AttributeResponse>>> getAllAttributes(
      @RequestParam(required = false) String subCategoryId) {
    List<AttributeResponse> data = subCategoryId != null && !subCategoryId.isBlank()
        ? attributeService.getAttributesForSubCategory(subCategoryId)
        : attributeService.getAllAttributes();
    return ResponseEntity.ok(
        ApiResponse.<List<AttributeResponse>>builder()
            .data(data)
            .build());
  }

  @GetMapping("/name/{name}")
  public ResponseEntity<ApiResponse<AttributeResponse>> getAttributeByName(@PathVariable String name) {
    return ResponseEntity.ok(
        ApiResponse.<AttributeResponse>builder()
            .data(attributeService.getAttributeByName(name))
            .build());
  }

  @PostMapping("/{attributeId}/values")
  public ResponseEntity<ApiResponse<AttributeResponse>> addAttributeValue(
      @RequestHeader(value = AppConstants.JWT_CLAIM_ROLE, required = false) String role,
      @PathVariable String attributeId, @RequestBody @NotEmpty List<String> values) {
    if (values.isEmpty()) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    if (role != null && !role.equals(AppConstants.ROLE_ADMIN)) {
      throw new AppException(ErrorCode.FORBIDDEN);
    }
    if (attributeId == null || attributeId.isBlank()) {
      throw new AppException(ErrorCode.ATTRIBUTE_NOT_FOUND);
    }

    return ResponseEntity.ok(ApiResponse.<AttributeResponse>builder()
        .data(attributeService.addAttributeValue(attributeId, values))
        .build());
  }
}
