package com.naodab.bookingservice.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.naodab.bookingservice.dto.response.UserOrderActivityCountsResponse;
import com.naodab.bookingservice.services.UserActivityAdminService;
import com.naodab.commonservice.constant.AppConstants;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.commonservice.response.ApiResponse;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserActivityAdminController {

  UserActivityAdminService userActivityAdminService;

  @GetMapping("/{profileId}/order-counts")
  public ResponseEntity<ApiResponse<UserOrderActivityCountsResponse>> getOrderActivityCounts(
      @PathVariable String profileId,
      @RequestHeader(value = AppConstants.JWT_CLAIM_ROLE, required = false) String role) {
    requireAdmin(role);
    return ResponseEntity.ok(ApiResponse.<UserOrderActivityCountsResponse>builder()
        .data(userActivityAdminService.getOrderActivityCounts(profileId))
        .build());
  }

  private static void requireAdmin(String role) {
    if (!AppConstants.ROLE_ADMIN.equals(role)) {
      throw new AppException(ErrorCode.FORBIDDEN);
    }
  }
}
