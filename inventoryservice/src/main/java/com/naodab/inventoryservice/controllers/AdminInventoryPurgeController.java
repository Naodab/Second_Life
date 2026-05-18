package com.naodab.inventoryservice.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.naodab.commonservice.constant.AppConstants;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.commonservice.response.ApiResponse;
import com.naodab.inventoryservice.dto.response.InventoryPurgeStatsResponse;
import com.naodab.inventoryservice.services.InventoryAdminPurgeService;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/admin/inventory")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AdminInventoryPurgeController {

  InventoryAdminPurgeService inventoryAdminPurgeService;

  @PostMapping("/purge-all")
  public ResponseEntity<ApiResponse<InventoryPurgeStatsResponse>> purgeAll(
      @RequestHeader(value = AppConstants.JWT_CLAIM_ROLE, required = false) String role) {
    if (!AppConstants.ROLE_ADMIN.equals(role)) {
      throw new AppException(ErrorCode.FORBIDDEN);
    }
    InventoryPurgeStatsResponse stats = inventoryAdminPurgeService.purgeAllListingLinkedInventory();
    return ResponseEntity.ok(ApiResponse.<InventoryPurgeStatsResponse>builder().data(stats).build());
  }
}
