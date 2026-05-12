package com.naodab.inventoryservice.controllers;

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
      @RequestParam(name = "mode", defaultValue = "BUY") String modeRaw) {
    InventoryItem.InventoryMode mode;
    try {
      mode = InventoryItem.InventoryMode.valueOf(modeRaw.trim().toUpperCase());
    } catch (IllegalArgumentException e) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    ListingVariantAvailabilityResponse body = inventoryAvailabilityService
        .findAvailableQuantityIfTracked(listingVariantId, mode)
        .map(
            q -> ListingVariantAvailabilityResponse.builder()
                .tracked(true)
                .availableQuantity(q)
                .build())
        .orElse(
            ListingVariantAvailabilityResponse.builder()
                .tracked(false)
                .availableQuantity(null)
                .build());

    return ResponseEntity.ok(ApiResponse.<ListingVariantAvailabilityResponse>builder().data(body).build());
  }

  @GetMapping("/{listingVariantId}/rental-periods")
  public ResponseEntity<ApiResponse<List<RentalPeriodResponse>>> getRentalPeriods(
      @PathVariable String listingVariantId) {
    List<RentalPeriodResponse> periods = inventoryRentalPeriodService.listBookedRentalPeriods(listingVariantId);
    return ResponseEntity.ok(
        ApiResponse.<List<RentalPeriodResponse>>builder().data(periods).build());
  }
}
