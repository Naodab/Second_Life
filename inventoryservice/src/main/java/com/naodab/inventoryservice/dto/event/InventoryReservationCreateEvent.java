package com.naodab.inventoryservice.dto.event;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class InventoryReservationCreateEvent {

  String inventoryReservationId;

  String listingVariantId;

  String customerId;

  String referenceId;

  Integer quantity;

  String mode;

  LocalDateTime expiresAt;

  LocalDateTime rentalSlotStart;

  LocalDateTime rentalSlotEnd;
}
