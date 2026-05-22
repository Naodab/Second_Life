package com.naodab.bookingservice.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.naodab.bookingservice.dto.request.BookingOrderCreateRequest;
import com.naodab.bookingservice.dto.response.BookingOrderResponse;
import com.naodab.bookingservice.services.BookingOrderService;
import com.naodab.commonservice.constant.AppConstants;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BookingOrderController {

  BookingOrderService bookingOrderService;

  @PostMapping
  public ResponseEntity<BookingOrderResponse> createBookingOrder(
      @RequestHeader(value = AppConstants.HEADER_PROFILE_ID, required = false) String profileIdHeader,
      @RequestBody @Validated BookingOrderCreateRequest request) {
    String profileId = validateProfileId(profileIdHeader);
    return ResponseEntity.ok(bookingOrderService.createBookingOrder(profileId, request));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> deleteBookingOrder(@PathVariable String id) {
    bookingOrderService.deleteBookingOrder(id);
    return ResponseEntity.noContent().build();
  }

  private String validateProfileId(String profileIdHeader) {
    if (profileIdHeader == null || profileIdHeader.isBlank()) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    return profileIdHeader.trim();
  }
}
