package com.naodab.inventoryservice.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import com.naodab.inventoryservice.models.InventoryReservation;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class RentalPeriodResponse {
  String reservationId;
  LocalDate rentalStart;
  LocalDate rentalEnd;

  LocalDateTime slotStart;
  LocalDateTime slotEnd;

  Long quantity;
  InventoryReservation.ReservationStatus status;
}
