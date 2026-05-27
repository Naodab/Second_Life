package com.naodab.inventoryservice.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.naodab.commonservice.response.ApiResponse;
import com.naodab.inventoryservice.dto.event.InventoryReservationCreateEvent;
import com.naodab.inventoryservice.services.InventoryReservationService;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/reservations")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class InventoryReservationController {

  InventoryReservationService inventoryReservationService;

  @PostMapping("/buy")
  public ResponseEntity<ApiResponse<Void>> createBuyReservation(
      @RequestBody InventoryReservationCreateEvent request) {
    inventoryReservationService.createBuyReservation(request);
    return ResponseEntity.ok(ApiResponse.<Void>builder().build());
  }

  @PostMapping("/rent")
  public ResponseEntity<ApiResponse<Void>> createRentReservation(
      @RequestBody InventoryReservationCreateEvent request) {
    inventoryReservationService.createRentReservation(request);
    return ResponseEntity.ok(ApiResponse.<Void>builder().build());
  }

  @DeleteMapping("/{reservationId}")
  public ResponseEntity<ApiResponse<Void>> releaseReservation(@PathVariable String reservationId) {
    inventoryReservationService.releaseReservation(reservationId);
    return ResponseEntity.ok(ApiResponse.<Void>builder().build());
  }
}
