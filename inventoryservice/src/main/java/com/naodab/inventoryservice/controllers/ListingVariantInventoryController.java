package com.naodab.inventoryservice.controllers;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.commonservice.response.ApiResponse;
import com.naodab.inventoryservice.dto.response.ListingVariantAvailabilityResponse;
import com.naodab.inventoryservice.dto.response.ListingVariantIntervalAvailabilityResponse;
import com.naodab.inventoryservice.dto.response.RentalPeriodResponse;
import com.naodab.inventoryservice.models.InventoryItem;
import com.naodab.inventoryservice.services.InventoryAvailabilityService;
import com.naodab.inventoryservice.services.InventoryRentalPeriodService;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/listing-variants")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class ListingVariantInventoryController {

  InventoryRentalPeriodService inventoryRentalPeriodService;
  InventoryAvailabilityService inventoryAvailabilityService;

  @GetMapping("/{listingVariantId}/availability")
  public ResponseEntity<ApiResponse<ListingVariantAvailabilityResponse>> getAvailability(
      @PathVariable String listingVariantId,
      @RequestParam(name = "mode", defaultValue = "BUY") String modeRaw,
      @RequestParam(name = "quantity", required = false) Integer quantity) {
    InventoryItem.InventoryMode mode;
    try {
      mode = InventoryItem.InventoryMode.valueOf(modeRaw.trim().toUpperCase());
    } catch (IllegalArgumentException e) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }

    Long availableQty = null;
    boolean tracked = false;
    if (quantity != null) {
      long available = inventoryAvailabilityService.requireAvailableQuantity(
          listingVariantId, mode, quantity.longValue());
      tracked = true;
      availableQty = available;
    } else {
      var opt = inventoryAvailabilityService.findAvailableQuantityIfTracked(listingVariantId, mode);
      if (opt.isPresent()) {
        tracked = true;
        availableQty = opt.get();
      }
    }

    ListingVariantAvailabilityResponse body = ListingVariantAvailabilityResponse.builder()
        .tracked(tracked)
        .availableQuantity(availableQty)
        .build();

    return ResponseEntity.ok(ApiResponse.<ListingVariantAvailabilityResponse>builder().data(body).build());
  }

  @GetMapping("/{listingVariantId}/availability-in-range")
  public ResponseEntity<ApiResponse<ListingVariantIntervalAvailabilityResponse>> getAvailabilityInRange(
      @PathVariable String listingVariantId,
      @RequestParam(name = "from") String fromRaw,
      @RequestParam(name = "to") String toRaw,
      @RequestParam(name = "mode", defaultValue = "RENT") String modeRaw,
      @RequestParam(name = "quantity", required = false) Integer quantity) {
    final Instant from;
    final Instant to;
    try {
      from = Instant.parse(fromRaw.trim());
      to = Instant.parse(toRaw.trim());
    } catch (DateTimeParseException e) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    InventoryItem.InventoryMode mode;
    try {
      mode = InventoryItem.InventoryMode.valueOf(modeRaw.trim().toUpperCase());
    } catch (IllegalArgumentException e) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }

    Long availableQty = null;
    boolean tracked = false;
    var opt = inventoryAvailabilityService.findMinAvailableQuantityInOpenInterval(
        listingVariantId, mode, from, to);
    if (opt.isPresent()) {
      tracked = true;
      availableQty = opt.get();
    }

    ListingVariantIntervalAvailabilityResponse body = ListingVariantIntervalAvailabilityResponse.builder()
        .tracked(tracked)
        .availableQuantity(availableQty)
        .intervalStart(from)
        .intervalEnd(to)
        .build();

    return ResponseEntity.ok(ApiResponse.<ListingVariantIntervalAvailabilityResponse>builder().data(body).build());
  }

  @GetMapping("/{listingVariantId}/rental-periods")
  public ResponseEntity<ApiResponse<List<RentalPeriodResponse>>> getRentalPeriods(
      @PathVariable String listingVariantId) {
    List<RentalPeriodResponse> periods = inventoryRentalPeriodService.listBookedRentalPeriods(listingVariantId);
    return ResponseEntity.ok(
        ApiResponse.<List<RentalPeriodResponse>>builder().data(periods).build());
  }
}
