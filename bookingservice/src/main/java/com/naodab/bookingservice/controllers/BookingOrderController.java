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

import com.naodab.bookingservice.dto.request.BookingOrderCreateRequest;
import com.naodab.bookingservice.dto.request.BookingOrderStatusUpdateRequest;
import com.naodab.bookingservice.dto.response.BookingOrderResponse;
import com.naodab.bookingservice.models.enums.BookingOrderStatus;
import com.naodab.bookingservice.services.BookingOrderAdminService;
import com.naodab.bookingservice.services.BookingOrderService;
import com.naodab.commonservice.response.PagedItemsResponse;
import com.naodab.commonservice.constant.AppConstants;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.commonservice.response.ApiResponse;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BookingOrderController {

  BookingOrderService bookingOrderService;
  BookingOrderAdminService bookingOrderAdminService;

  @GetMapping("/admin")
  public ResponseEntity<ApiResponse<PagedItemsResponse<BookingOrderResponse>>> listBookingOrdersAdmin(
      @RequestHeader(value = AppConstants.JWT_CLAIM_ROLE, required = false) String role,
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer pageSize,
      @RequestParam(required = false) BookingOrderStatus status) {
    requireAdmin(role);
    return ResponseEntity.ok(ApiResponse.<PagedItemsResponse<BookingOrderResponse>>builder()
        .data(bookingOrderAdminService.listOrders(page, pageSize, status))
        .build());
  }

  @GetMapping
  public ResponseEntity<ApiResponse<List<BookingOrderResponse>>> listBookingOrders(
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader) {
    String profileId = validateProfileId(profileIdHeader);
    return ResponseEntity.ok(ApiResponse.<List<BookingOrderResponse>>builder()
        .data(bookingOrderService.listBookingOrders(profileId))
        .build());
  }

  @GetMapping("/by-facility/{facilityId}")
  public ResponseEntity<ApiResponse<List<BookingOrderResponse>>> listFacilityOrders(
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader,
      @PathVariable String facilityId) {
    String profileId = validateProfileId(profileIdHeader);
    return ResponseEntity.ok(ApiResponse.<List<BookingOrderResponse>>builder()
        .data(bookingOrderService.listFacilityOrders(profileId, facilityId))
        .build());
  }

  @PatchMapping("/{id}/status")
  public ResponseEntity<ApiResponse<BookingOrderResponse>> updateBookingOrderStatus(
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader,
      @PathVariable String id,
      @RequestBody @Validated BookingOrderStatusUpdateRequest request) {
    String profileId = validateProfileId(profileIdHeader);
    return ResponseEntity.ok(ApiResponse.<BookingOrderResponse>builder()
        .data(bookingOrderService.updateBookingOrderStatus(profileId, id, request))
        .build());
  }

  @PostMapping
  public ResponseEntity<BookingOrderResponse> createBookingOrder(
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader,
      @RequestBody @Validated BookingOrderCreateRequest request) {
    String profileId = validateProfileId(profileIdHeader);
    return ResponseEntity.ok(bookingOrderService.createBookingOrder(profileId, request));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> cancelBookingOrder(
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader,
      @PathVariable String id) {
    String profileId = validateProfileId(profileIdHeader);
    bookingOrderService.cancelBookingOrder(profileId, id);
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
