package com.naodab.productservice.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import com.naodab.productservice.services.FacilityService;

import com.naodab.productservice.dto.response.FacilityResponse;
import com.naodab.productservice.dto.request.FacilityCreateRequest;
import com.naodab.commonservice.constant.AppConstants;
import com.naodab.commonservice.response.ApiResponse;
import com.naodab.productservice.dto.request.FacilitySearchRequest;
import com.naodab.productservice.dto.request.FacilityUpdateRequest;

import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequestMapping("/facilities")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class FacilityController {
  FacilityService facilityService;

  @PostMapping
  public ResponseEntity<ApiResponse<FacilityResponse>> createFacility(
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader,
      @RequestBody FacilityCreateRequest request) {
    log.info("Creating facility for profile: {}", profileIdHeader);
    String profileId;
    if (StringUtils.hasText(profileIdHeader)) {
      profileId = profileIdHeader.trim();
    } else {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    return ResponseEntity.ok(ApiResponse.<FacilityResponse>builder()
        .data(facilityService.createFacility(profileId, request))
        .build());
  }

  @GetMapping("/{id}")
  public ResponseEntity<ApiResponse<FacilityResponse>> getFacilityById(@PathVariable String id) {
    return ResponseEntity.ok(ApiResponse.<FacilityResponse>builder()
        .data(facilityService.getFacilityById(id))
        .build());
  }

  @GetMapping
  public ResponseEntity<ApiResponse<List<FacilityResponse>>> getAllFacilities(
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer pageSize) {
    return ResponseEntity.ok(ApiResponse.<List<FacilityResponse>>builder()
        .data(facilityService.getAllFacilities(page, pageSize))
        .build());
  }

  @GetMapping("/search")
  public ResponseEntity<ApiResponse<List<FacilityResponse>>> searchFacilities(
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer pageSize,
      @RequestParam(required = false) String name,
      @RequestParam(required = false) String provinceCode,
      @RequestParam(required = false) String wardCode,
      @RequestParam(required = false) String type,
      @RequestParam(required = false) String status,
      @RequestParam(required = false) String ownerId) {
    FacilitySearchRequest request = FacilitySearchRequest.builder()
        .name(name)
        .provinceCode(provinceCode)
        .wardCode(wardCode)
        .type(type)
        .status(status)
        .ownerId(ownerId)
        .build();

    return ResponseEntity.ok(ApiResponse.<List<FacilityResponse>>builder()
        .data(facilityService.searchFacilities(page, pageSize, request))
        .build());
  }

  @PutMapping("/{id}")
  public ResponseEntity<ApiResponse<FacilityResponse>> updateFacility(@PathVariable String id,
      @RequestBody FacilityUpdateRequest request) {
    return ResponseEntity.ok(ApiResponse.<FacilityResponse>builder()
        .data(facilityService.updateFacility(id, request))
        .build());
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<ApiResponse<Void>> deleteFacility(@PathVariable String id) {
    facilityService.deleteFacility(id);
    return ResponseEntity.ok(ApiResponse.<Void>builder().build());
  }

  @PostMapping("/{id}/main-image")
  public ResponseEntity<ApiResponse<Void>> uploadMainImageFacility(@PathVariable String id,
      @RequestParam MultipartFile image) {
    return ResponseEntity.ok(ApiResponse.<Void>builder().build());
  }
}
