package com.naodab.bookingservice.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.naodab.bookingservice.dto.request.RentalOrderCreateRequest;
import com.naodab.bookingservice.dto.request.RentalOrderStatusUpdateRequest;
import com.naodab.bookingservice.dto.response.RentalOrderResponse;
import com.naodab.bookingservice.models.enums.RentalOrderStatus;
import com.naodab.bookingservice.services.RentalOrderAdminService;
import com.naodab.bookingservice.services.RentalOrderService;
import com.naodab.commonservice.response.PagedItemsResponse;
import com.naodab.commonservice.constant.AppConstants;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.commonservice.response.ApiResponse;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/rental-orders")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RentalOrderController {

  RentalOrderService rentalOrderService;
  RentalOrderAdminService rentalOrderAdminService;

  @GetMapping("/admin")
  public ResponseEntity<ApiResponse<PagedItemsResponse<RentalOrderResponse>>> listRentalOrdersAdmin(
      @RequestHeader(value = AppConstants.JWT_CLAIM_ROLE, required = false) String role,
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer pageSize,
      @RequestParam(required = false) RentalOrderStatus status) {
    requireAdmin(role);
    return ResponseEntity.ok(ApiResponse.<PagedItemsResponse<RentalOrderResponse>>builder()
        .data(rentalOrderAdminService.listOrders(page, pageSize, status))
        .build());
  }

  @PostMapping
  public ResponseEntity<ApiResponse<RentalOrderResponse>> createRentalOrder(
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader,
      @RequestBody @Validated RentalOrderCreateRequest request) {
    String profileId = validateProfileId(profileIdHeader);
    return ResponseEntity.ok(ApiResponse.<RentalOrderResponse>builder()
        .data(rentalOrderService.createRentalOrder(profileId, request))
        .build());
  }

  @GetMapping
  public ResponseEntity<ApiResponse<List<RentalOrderResponse>>> listRentalOrders(
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader) {
    String profileId = validateProfileId(profileIdHeader);
    return ResponseEntity.ok(ApiResponse.<List<RentalOrderResponse>>builder()
        .data(rentalOrderService.listRentalOrders(profileId))
        .build());
  }

  @GetMapping("/by-facility/{facilityId}")
  public ResponseEntity<ApiResponse<List<RentalOrderResponse>>> listFacilityRentalOrders(
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader,
      @PathVariable String facilityId) {
    String profileId = validateProfileId(profileIdHeader);
    return ResponseEntity.ok(ApiResponse.<List<RentalOrderResponse>>builder()
        .data(rentalOrderService.listFacilityRentalOrders(profileId, facilityId))
        .build());
  }

  @PatchMapping("/{id}/status")
  public ResponseEntity<ApiResponse<RentalOrderResponse>> updateRentalOrderStatus(
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader,
      @PathVariable String id,
      @RequestBody @Validated RentalOrderStatusUpdateRequest request) {
    String profileId = validateProfileId(profileIdHeader);
    return ResponseEntity.ok(ApiResponse.<RentalOrderResponse>builder()
        .data(rentalOrderService.updateRentalOrderStatus(profileId, id, request))
        .build());
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> cancelRentalOrder(
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader,
      @PathVariable String id) {
    String profileId = validateProfileId(profileIdHeader);
    rentalOrderService.cancelRentalOrder(profileId, id);
    return ResponseEntity.noContent().build();
  }

  private String validateProfileId(String profileIdHeader) {
    if (profileIdHeader == null || profileIdHeader.isBlank()) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    return profileIdHeader.trim();
  }

  private static void requireAdmin(String role) {
    if (!AppConstants.ROLE_ADMIN.equals(role)) {
      throw new AppException(ErrorCode.FORBIDDEN);
    }
  }
}
