package com.naodab.bookingservice.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.naodab.bookingservice.dto.request.CustomerUpsertRequest;
import com.naodab.bookingservice.dto.response.BookingOrderCustomerResponse;
import com.naodab.bookingservice.services.CustomerService;
import com.naodab.commonservice.constant.AppConstants;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.commonservice.response.ApiResponse;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/customers")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CustomerController {

  CustomerService customerService;

  @GetMapping
  public ResponseEntity<ApiResponse<List<BookingOrderCustomerResponse>>> listCustomers(
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader) {
    return ResponseEntity.ok(ApiResponse.<List<BookingOrderCustomerResponse>>builder()
        .data(customerService.listCustomers(requireProfileId(profileIdHeader)))
        .build());
  }

  @PostMapping
  public ResponseEntity<ApiResponse<BookingOrderCustomerResponse>> createCustomer(
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader,
      @RequestBody @Validated CustomerUpsertRequest request) {
    return ResponseEntity.ok(ApiResponse.<BookingOrderCustomerResponse>builder()
        .data(customerService.createCustomer(requireProfileId(profileIdHeader), request))
        .build());
  }

  @PutMapping("/{id}")
  public ResponseEntity<ApiResponse<BookingOrderCustomerResponse>> updateCustomer(
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader,
      @PathVariable String id,
      @RequestBody @Validated CustomerUpsertRequest request) {
    return ResponseEntity.ok(ApiResponse.<BookingOrderCustomerResponse>builder()
        .data(customerService.updateCustomer(requireProfileId(profileIdHeader), id, request))
        .build());
  }

  @PutMapping("/{id}/default")
  public ResponseEntity<ApiResponse<BookingOrderCustomerResponse>> setDefaultCustomer(
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader,
      @PathVariable String id) {
    return ResponseEntity.ok(ApiResponse.<BookingOrderCustomerResponse>builder()
        .data(customerService.setDefaultCustomer(requireProfileId(profileIdHeader), id))
        .build());
  }

  private static String requireProfileId(String profileIdHeader) {
    if (profileIdHeader == null || profileIdHeader.isBlank()) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    return profileIdHeader.trim();
  }
}
