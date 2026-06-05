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
    long h9 = h8 + InventoryAvailabilityServiceImpl.HOURLY_SLOT_TURNOVER_MILLIS;
    long h12 = LocalDateTime.of(2026, 5, 21, 12, 0).toInstant(UTC).toEpochMilli();

    long blockedEnd = h9;
    List<long[]> clipped6to12 = List.of(new long[] {h6, Math.min(blockedEnd, h12), 1L});
    List<long[]> clipped8to12 = List.of(new long[] {h8, Math.min(blockedEnd, h12), 1L});

    long min6to12 = InventoryAvailabilityServiceImpl.minAvailableQuantityInOpenInterval(2L, clipped6to12, h6, h12);
    assertEquals(1L, min6to12);

    long min8to12 = InventoryAvailabilityServiceImpl.minAvailableQuantityInOpenInterval(2L, clipped8to12, h8, h12);
    assertEquals(1L, min8to12);

    long min9to12 = InventoryAvailabilityServiceImpl.minAvailableQuantityInOpenInterval(2L, List.of(), h9, h12);
    assertEquals(2L, min9to12);
  }

  @Test
  void oneUnit_juneBooking_doesNotBlockJulyWindow() {
    InventoryReservation juneBooking =
        InventoryReservation.builder()
            .rentalSlotStart(LocalDateTime.of(2026, 6, 5, 0, 0))
            .rentalSlotEnd(LocalDateTime.of(2026, 6, 30, 0, 0))
            .quantity(1L)
            .build();

    long juneBlockedEnd =
        InventoryAvailabilityServiceImpl.reservationToBlockedIntervalMillis(juneBooking).orElseThrow()[1];
    long july4 = LocalDateTime.of(2026, 7, 4, 0, 0).toInstant(UTC).toEpochMilli();
    long july6 = LocalDateTime.of(2026, 7, 6, 0, 0).toInstant(UTC).toEpochMilli();

    assertEquals(true, juneBlockedEnd <= july4);

    List<long[]> clipped = List.of();
    long minJuly = InventoryAvailabilityServiceImpl.minAvailableQuantityInOpenInterval(1L, clipped, july4, july6);
    assertEquals(1L, minJuly);
  }

  @Test
  void hourlyReservation_blockedIntervalExtendsOneHourPastReturn() {
    InventoryReservation r =
        InventoryReservation.builder()
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
