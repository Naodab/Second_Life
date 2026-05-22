package com.naodab.inventoryservice.services.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.naodab.inventoryservice.models.InventoryReservation;

class InventoryAvailabilityServiceImplTest {

  static final ZoneOffset UTC = ZoneOffset.UTC;

  @Test
  void twoUnits_oneHourlyBookingUntil8_query6to12_minFreeIsOne() {
    long h6 = LocalDateTime.of(2026, 5, 21, 6, 0).toInstant(UTC).toEpochMilli();
    long h8 = LocalDateTime.of(2026, 5, 21, 8, 0).toInstant(UTC).toEpochMilli();
    long h12 = LocalDateTime.of(2026, 5, 21, 12, 0).toInstant(UTC).toEpochMilli();

    long blockedEnd = h8 + InventoryAvailabilityServiceImpl.HOURLY_SLOT_TURNOVER_MILLIS;
    List<long[]> clipped = List.of(new long[] {h6, Math.min(blockedEnd, h12), 1L});

    long min = InventoryAvailabilityServiceImpl.minAvailableQuantityInOpenInterval(2L, clipped, h6, h12);
    assertEquals(1L, min);
  }

  @Test
  void twoUnits_bookingUntil8_withTurnover_blocksImmediate8to12SecondUnitIfFullyBooked() {
    long h6 = LocalDateTime.of(2026, 5, 21, 6, 0).toInstant(UTC).toEpochMilli();
    long h8 = LocalDateTime.of(2026, 5, 21, 8, 0).toInstant(UTC).toEpochMilli();
    long h9 = LocalDateTime.of(2026, 5, 21, 9, 0).toInstant(UTC).toEpochMilli();
    long h12 = LocalDateTime.of(2026, 5, 21, 12, 0).toInstant(UTC).toEpochMilli();

    long blockedEnd = h8 + InventoryAvailabilityServiceImpl.HOURLY_SLOT_TURNOVER_MILLIS;
    List<long[]> clipped = List.of(new long[] {h6, blockedEnd, 1L});

    long min6to12 = InventoryAvailabilityServiceImpl.minAvailableQuantityInOpenInterval(2L, clipped, h6, h12);
    assertEquals(1L, min6to12);

    long min8to12 = InventoryAvailabilityServiceImpl.minAvailableQuantityInOpenInterval(2L, clipped, h8, h12);
    assertEquals(1L, min8to12);

    long min9to12 = InventoryAvailabilityServiceImpl.minAvailableQuantityInOpenInterval(2L, clipped, h9, h12);
    assertEquals(2L, min9to12);
  }

  @Test
  void hourlyReservation_blockedIntervalExtendsOneHourPastReturn() {
    InventoryReservation r = InventoryReservation.builder()
        .rentalSlotStart(LocalDateTime.of(2026, 5, 21, 6, 0))
        .rentalSlotEnd(LocalDateTime.of(2026, 5, 21, 8, 0))
        .quantity(1L)
        .build();

    long h6 = LocalDateTime.of(2026, 5, 21, 6, 0).toInstant(UTC).toEpochMilli();
    long h8 = LocalDateTime.of(2026, 5, 21, 8, 0).toInstant(UTC).toEpochMilli();
    long h9 = h8 + InventoryAvailabilityServiceImpl.HOURLY_SLOT_TURNOVER_MILLIS;

    long[] blocked = InventoryAvailabilityServiceImpl.reservationToBlockedIntervalMillis(r).orElseThrow();
    assertEquals(h6, blocked[0]);
    assertEquals(h9, blocked[1]);
  }
}
