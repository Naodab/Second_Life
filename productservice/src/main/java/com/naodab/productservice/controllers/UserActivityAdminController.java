package com.naodab.productservice.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.naodab.commonservice.constant.AppConstants;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.commonservice.response.ApiResponse;
import com.naodab.productservice.dto.response.UserSellerActivityCountsResponse;
import com.naodab.productservice.services.UserActivityAdminService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserActivityAdminController {

  UserActivityAdminService userActivityAdminService;

  @GetMapping("/{profileId}/seller-counts")
  public ResponseEntity<ApiResponse<UserSellerActivityCountsResponse>> getSellerActivityCounts(
      @PathVariable String profileId,
      @RequestHeader(value = AppConstants.JWT_CLAIM_ROLE, required = false) String role) {
    requireAdmin(role);
    return ResponseEntity.ok(ApiResponse.<UserSellerActivityCountsResponse>builder()
        .data(userActivityAdminService.getSellerActivityCounts(profileId))
        .build());
  }

  @GetMapping("/{profileId}/listing-variant-ids")
  public ResponseEntity<ApiResponse<List<String>>> listListingVariantIdsForOwner(
      @PathVariable String profileId,
      @RequestHeader(value = AppConstants.JWT_CLAIM_ROLE, required = false) String role) {
    requireAdmin(role);
    return ResponseEntity.ok(ApiResponse.<List<String>>builder()
        .data(userActivityAdminService.listListingVariantIdsForOwner(profileId))
        .build());
  }

  private static void requireAdmin(String role) {
    if (!AppConstants.ROLE_ADMIN.equals(role)) {
      throw new AppException(ErrorCode.FORBIDDEN);
    }
  }
}
