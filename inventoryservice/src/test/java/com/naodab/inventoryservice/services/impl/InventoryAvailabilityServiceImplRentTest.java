package com.naodab.inventoryservice.services.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;

import com.naodab.inventoryservice.models.InventoryReservation;

class InventoryAvailabilityServiceImplRentTest {

  static final ZoneOffset UTC = ZoneOffset.UTC;

  static List<long[]> clipBlocked(InventoryReservation r, long q0, long q1) {
    Optional<long[]> iv = InventoryAvailabilityServiceImpl.reservationToBlockedIntervalMillis(r);
    if (iv.isEmpty()) {
      return List.of();
    }
    long a = iv.get()[0];
    long b = iv.get()[1];
    if (!(a < q1 && b > q0)) {
      return List.of();
    }
    long qty = r.getQuantity() == null ? 1L : Math.max(1L, r.getQuantity());
    return List.of(new long[] {Math.max(a, q0), Math.min(b, q1), qty});
  }

  static long minForReservations(long physical, List<InventoryReservation> rows, long q0, long q1) {
    List<long[]> clipped = new ArrayList<>();
    for (InventoryReservation r : rows) {
      clipped.addAll(clipBlocked(r, q0, q1));
    }
    return InventoryAvailabilityServiceImpl.minAvailableQuantityInOpenInterval(physical, clipped, q0, q1);
  }

  static long ms(LocalDateTime dt) {
    return dt.toInstant(UTC).toEpochMilli();
  }

  @Test
  void twoUnits_hourlyBooking_clippedToQuery_respectsTurnoverBoundary() {
    long h6 = ms(LocalDateTime.of(2026, 5, 21, 6, 0));
    long h8 = ms(LocalDateTime.of(2026, 5, 21, 8, 0));
    long h9 = h8 + InventoryAvailabilityServiceImpl.HOURLY_SLOT_TURNOVER_MILLIS;
    long h12 = ms(LocalDateTime.of(2026, 5, 21, 12, 0));

    InventoryReservation booking =
        InventoryReservation.builder()
            .rentalSlotStart(LocalDateTime.of(2026, 5, 21, 6, 0))
            .rentalSlotEnd(LocalDateTime.of(2026, 5, 21, 8, 0))
            .quantity(1L)
            .build();

    assertEquals(1L, minForReservations(2L, List.of(booking), h6, h12));
    assertEquals(1L, minForReservations(2L, List.of(booking), h8, h12));
    assertEquals(2L, minForReservations(2L, List.of(booking), h9, h12));
  }

  @Test
  void dailyDateRange_juneBooking_doesNotReduceJulyAvailability() {
    InventoryReservation june =
        InventoryReservation.builder()
            .rentalSlotStart(LocalDateTime.of(2026, 6, 5, 0, 0))
            .rentalSlotEnd(LocalDateTime.of(2026, 6, 30, 0, 0))
            .quantity(1L)
            .build();

    long july4 = ms(LocalDateTime.of(2026, 7, 4, 0, 0));
    long july6 = ms(LocalDateTime.of(2026, 7, 6, 0, 0));

    assertEquals(1L, minForReservations(1L, List.of(june), july4, july6));
  }

  @Test
  void dailyDateRange_sameWindowFullyBooked_returnsZero() {
    InventoryReservation june =
        InventoryReservation.builder()
            .rentalSlotStart(LocalDateTime.of(2026, 6, 5, 0, 0))
            .rentalSlotEnd(LocalDateTime.of(2026, 6, 30, 0, 0))
            .quantity(1L)
            .build();

    long jun5 = ms(LocalDateTime.of(2026, 6, 5, 0, 0));
    long jun30 = ms(LocalDateTime.of(2026, 6, 30, 0, 0));

    assertEquals(0L, minForReservations(1L, List.of(june), jun5, jun30));
  }

  @Test
  void dailyRentalStartEnd_usesOneDayTurnoverBuffer() {
    InventoryReservation daily =
        InventoryReservation.builder()
            .rentalStart(LocalDate.of(2026, 6, 5))
            .rentalEnd(LocalDate.of(2026, 6, 29))
            .quantity(1L)
            .build();

    long[] blocked = InventoryAvailabilityServiceImpl.reservationToBlockedIntervalMillis(daily).orElseThrow();
    long jun5 = LocalDate.of(2026, 6, 5).atStartOfDay(UTC).toInstant().toEpochMilli();
    long jun30 = LocalDate.of(2026, 6, 30).atStartOfDay(UTC).toInstant().toEpochMilli();
    long expectedEnd = jun30 + InventoryAvailabilityServiceImpl.DAILY_RENTAL_TURNOVER_MILLIS;

    assertEquals(jun5, blocked[0]);
    assertEquals(expectedEnd, blocked[1]);

    long jul4 = ms(LocalDateTime.of(2026, 7, 4, 0, 0));
    long jul6 = ms(LocalDateTime.of(2026, 7, 6, 0, 0));
    assertEquals(1L, minForReservations(1L, List.of(daily), jul4, jul6));
  }

  @Test
  void dailyRentalStartEnd_turnoverBlocksDayImmediatelyAfterReturn() {
    InventoryReservation daily =
        InventoryReservation.builder()
            .rentalStart(LocalDate.of(2026, 6, 5))
            .rentalEnd(LocalDate.of(2026, 6, 29))
            .quantity(1L)
            .build();

    long jun30 = LocalDate.of(2026, 6, 30).atStartOfDay(UTC).toInstant().toEpochMilli();
    long jul1 = LocalDate.of(2026, 7, 1).atStartOfDay(UTC).toInstant().toEpochMilli();
    long blockedEnd =
        InventoryAvailabilityServiceImpl.reservationToBlockedIntervalMillis(daily).orElseThrow()[1];

    assertTrue(blockedEnd > jun30);
    assertEquals(0L, minForReservations(1L, List.of(daily), jun30, jul1));
  }

  @Test
  void twoUnits_singleBooking_leavesOneFreeInOverlap() {
    InventoryReservation booking =
        InventoryReservation.builder()
            .rentalSlotStart(LocalDateTime.of(2026, 8, 1, 0, 0))
            .rentalSlotEnd(LocalDateTime.of(2026, 8, 5, 0, 0))
            .quantity(1L)
            .build();

    long aug1 = ms(LocalDateTime.of(2026, 8, 1, 0, 0));
    long aug5 = ms(LocalDateTime.of(2026, 8, 5, 0, 0));

    assertEquals(1L, minForReservations(2L, List.of(booking), aug1, aug5));
  }

  @Test
  void twoUnits_staggeredMayBookings_orderMay5to7_failsOnOverlapDay() {
    InventoryReservation bookingA =
        InventoryReservation.builder()
            .rentalSlotStart(LocalDateTime.of(2026, 5, 4, 0, 0))
            .rentalSlotEnd(LocalDateTime.of(2026, 5, 7, 0, 0))
            .quantity(1L)
            .build();
    InventoryReservation bookingB =
        InventoryReservation.builder()
            .rentalSlotStart(LocalDateTime.of(2026, 5, 6, 0, 0))
            .rentalSlotEnd(LocalDateTime.of(2026, 5, 9, 0, 0))
            .quantity(1L)
            .build();

    long may5 = ms(LocalDateTime.of(2026, 5, 5, 0, 0));
    long may8 = ms(LocalDateTime.of(2026, 5, 8, 0, 0));

    assertEquals(0L, minForReservations(2L, List.of(bookingA, bookingB), may5, may8));
  }

  @Test
  void twoUnits_twoOverlappingBookings_fullyConsumed() {
    InventoryReservation first =
        InventoryReservation.builder()
            .rentalSlotStart(LocalDateTime.of(2026, 9, 1, 0, 0))
            .rentalSlotEnd(LocalDateTime.of(2026, 9, 10, 0, 0))
            .quantity(1L)
            .build();
    InventoryReservation second =
        InventoryReservation.builder()
            .rentalSlotStart(LocalDateTime.of(2026, 9, 5, 0, 0))
            .rentalSlotEnd(LocalDateTime.of(2026, 9, 15, 0, 0))
            .quantity(1L)
            .build();

    long sep1 = ms(LocalDateTime.of(2026, 9, 1, 0, 0));
    long sep15 = ms(LocalDateTime.of(2026, 9, 15, 0, 0));

    assertEquals(0L, minForReservations(2L, List.of(first, second), sep1, sep15));
    assertEquals(1L, minForReservations(2L, List.of(first, second), sep1, ms(LocalDateTime.of(2026, 9, 5, 0, 0))));
  }

  @Test
  void partialOverlap_reducesMinFreeOnlyInsideOverlap() {
    InventoryReservation booking =
        InventoryReservation.builder()
            .rentalSlotStart(LocalDateTime.of(2026, 10, 10, 0, 0))
            .rentalSlotEnd(LocalDateTime.of(2026, 10, 20, 0, 0))
            .quantity(1L)
            .build();

    long beforeStart = ms(LocalDateTime.of(2026, 10, 1, 0, 0));
    long beforeEnd = ms(LocalDateTime.of(2026, 10, 10, 0, 0));
    long overlapStart = ms(LocalDateTime.of(2026, 10, 15, 0, 0));
    long overlapEnd = ms(LocalDateTime.of(2026, 10, 25, 0, 0));

    assertEquals(1L, minForReservations(1L, List.of(booking), beforeStart, beforeEnd));
    assertEquals(0L, minForReservations(1L, List.of(booking), overlapStart, overlapEnd));
  }

  @Test
  void nullQuantity_treatedAsOneUnit() {
    InventoryReservation booking =
        InventoryReservation.builder()
            .rentalSlotStart(LocalDateTime.of(2026, 11, 1, 0, 0))
            .rentalSlotEnd(LocalDateTime.of(2026, 11, 3, 0, 0))
            .quantity(null)
            .build();

    long nov1 = ms(LocalDateTime.of(2026, 11, 1, 0, 0));
    long nov3 = ms(LocalDateTime.of(2026, 11, 3, 0, 0));

    assertEquals(0L, minForReservations(1L, List.of(booking), nov1, nov3));
  }

  @Test
  void reservationWithoutDates_isIgnored() {
    InventoryReservation empty =
        InventoryReservation.builder().quantity(1L).build();

    assertTrue(InventoryAvailabilityServiceImpl.reservationToBlockedIntervalMillis(empty).isEmpty());
    assertEquals(2L, minForReservations(2L, List.of(empty), ms(LocalDateTime.of(2026, 12, 1, 0, 0)), ms(LocalDateTime.of(2026, 12, 5, 0, 0))));
  }
}
