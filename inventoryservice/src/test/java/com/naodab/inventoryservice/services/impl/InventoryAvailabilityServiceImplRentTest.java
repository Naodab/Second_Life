package com.naodab.inventoryservice.services.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Month;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;

import com.naodab.inventoryservice.models.InventoryReservation;

class InventoryAvailabilityServiceImplRentTest {

  static final ZoneOffset UTC = ZoneOffset.UTC;

  static LocalDateTime at(int y, Month m, int d) {
    return LocalDateTime.of(y, m, d, 0, 0);
  }

  static LocalDateTime at(int y, Month m, int d, int h) {
    return LocalDateTime.of(y, m, d, h, 0);
  }

  static LocalDate day(int y, Month m, int d) {
    return LocalDate.of(y, m, d);
  }

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
    long h6 = ms(at(2026, Month.MAY, 21, 6));
    long h8 = ms(at(2026, Month.MAY, 21, 8));
    long h9 = h8 + InventoryAvailabilityServiceImpl.HOURLY_SLOT_TURNOVER_MILLIS;
    long h12 = ms(at(2026, Month.MAY, 21, 12));

    InventoryReservation booking =
        InventoryReservation.builder()
            .rentalSlotStart(at(2026, Month.MAY, 21, 6))
            .rentalSlotEnd(at(2026, Month.MAY, 21, 8))
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
            .rentalSlotStart(at(2026, Month.JUNE, 5))
            .rentalSlotEnd(at(2026, Month.JUNE, 30))
            .quantity(1L)
            .build();

    long july4 = ms(at(2026, Month.JULY, 4));
    long july6 = ms(at(2026, Month.JULY, 6));

    assertEquals(1L, minForReservations(1L, List.of(june), july4, july6));
  }

  @Test
  void dailyDateRange_sameWindowFullyBooked_returnsZero() {
    InventoryReservation june =
        InventoryReservation.builder()
            .rentalSlotStart(at(2026, Month.JUNE, 5))
            .rentalSlotEnd(at(2026, Month.JUNE, 30))
            .quantity(1L)
            .build();

    long jun5 = ms(at(2026, Month.JUNE, 5));
    long jun30 = ms(at(2026, Month.JUNE, 30));

    assertEquals(0L, minForReservations(1L, List.of(june), jun5, jun30));
  }

  @Test
  void dailyRentalStartEnd_usesOneDayTurnoverBuffer() {
    InventoryReservation daily =
        InventoryReservation.builder()
            .rentalStart(day(2026, Month.JUNE, 5))
            .rentalEnd(day(2026, Month.JUNE, 29))
            .quantity(1L)
            .build();

    long[] blocked = InventoryAvailabilityServiceImpl.reservationToBlockedIntervalMillis(daily).orElseThrow();
    long jun5 = day(2026, Month.JUNE, 5).atStartOfDay(UTC).toInstant().toEpochMilli();
    long jun30 = day(2026, Month.JUNE, 30).atStartOfDay(UTC).toInstant().toEpochMilli();
    long expectedEnd = jun30 + InventoryAvailabilityServiceImpl.DAILY_RENTAL_TURNOVER_MILLIS;

    assertEquals(jun5, blocked[0]);
    assertEquals(expectedEnd, blocked[1]);

    long jul4 = ms(at(2026, Month.JULY, 4));
    long jul6 = ms(at(2026, Month.JULY, 6));
    assertEquals(1L, minForReservations(1L, List.of(daily), jul4, jul6));
  }

  @Test
  void dailyRentalStartEnd_turnoverBlocksDayImmediatelyAfterReturn() {
    InventoryReservation daily =
        InventoryReservation.builder()
            .rentalStart(day(2026, Month.JUNE, 5))
            .rentalEnd(day(2026, Month.JUNE, 29))
            .quantity(1L)
            .build();

    long jun30 = day(2026, Month.JUNE, 30).atStartOfDay(UTC).toInstant().toEpochMilli();
    long jul1 = day(2026, Month.JULY, 1).atStartOfDay(UTC).toInstant().toEpochMilli();
    long blockedEnd =
        InventoryAvailabilityServiceImpl.reservationToBlockedIntervalMillis(daily).orElseThrow()[1];

    assertTrue(blockedEnd > jun30);
    assertEquals(0L, minForReservations(1L, List.of(daily), jun30, jul1));
  }

  @Test
  void twoUnits_singleBooking_leavesOneFreeInOverlap() {
    InventoryReservation booking =
        InventoryReservation.builder()
            .rentalSlotStart(at(2026, Month.AUGUST, 1))
            .rentalSlotEnd(at(2026, Month.AUGUST, 5))
            .quantity(1L)
            .build();

    long aug1 = ms(at(2026, Month.AUGUST, 1));
    long aug5 = ms(at(2026, Month.AUGUST, 5));

    assertEquals(1L, minForReservations(2L, List.of(booking), aug1, aug5));
  }

  @Test
  void twoUnits_staggeredMayBookings_orderMay5to7_failsOnOverlapDay() {
    InventoryReservation bookingA =
        InventoryReservation.builder()
            .rentalSlotStart(at(2026, Month.MAY, 4))
            .rentalSlotEnd(at(2026, Month.MAY, 7))
            .quantity(1L)
            .build();
    InventoryReservation bookingB =
        InventoryReservation.builder()
            .rentalSlotStart(at(2026, Month.MAY, 6))
            .rentalSlotEnd(at(2026, Month.MAY, 9))
            .quantity(1L)
            .build();

    long may5 = ms(at(2026, Month.MAY, 5));
    long may8 = ms(at(2026, Month.MAY, 8));

    assertEquals(0L, minForReservations(2L, List.of(bookingA, bookingB), may5, may8));
  }

  @Test
  void twoUnits_twoOverlappingBookings_fullyConsumed() {
    InventoryReservation first =
        InventoryReservation.builder()
            .rentalSlotStart(at(2026, Month.SEPTEMBER, 1))
            .rentalSlotEnd(at(2026, Month.SEPTEMBER, 10))
            .quantity(1L)
            .build();
    InventoryReservation second =
        InventoryReservation.builder()
            .rentalSlotStart(at(2026, Month.SEPTEMBER, 5))
            .rentalSlotEnd(at(2026, Month.SEPTEMBER, 15))
            .quantity(1L)
            .build();

    long sep1 = ms(at(2026, Month.SEPTEMBER, 1));
    long sep15 = ms(at(2026, Month.SEPTEMBER, 15));

    assertEquals(0L, minForReservations(2L, List.of(first, second), sep1, sep15));
    assertEquals(1L, minForReservations(2L, List.of(first, second), sep1, ms(at(2026, Month.SEPTEMBER, 5))));
  }

  @Test
  void partialOverlap_reducesMinFreeOnlyInsideOverlap() {
    InventoryReservation booking =
        InventoryReservation.builder()
            .rentalSlotStart(at(2026, Month.OCTOBER, 10))
            .rentalSlotEnd(at(2026, Month.OCTOBER, 20))
            .quantity(1L)
            .build();

    long beforeStart = ms(at(2026, Month.OCTOBER, 1));
    long beforeEnd = ms(at(2026, Month.OCTOBER, 10));
    long overlapStart = ms(at(2026, Month.OCTOBER, 15));
    long overlapEnd = ms(at(2026, Month.OCTOBER, 25));

    assertEquals(1L, minForReservations(1L, List.of(booking), beforeStart, beforeEnd));
    assertEquals(0L, minForReservations(1L, List.of(booking), overlapStart, overlapEnd));
  }

  @Test
  void nullQuantity_treatedAsOneUnit() {
    InventoryReservation booking =
        InventoryReservation.builder()
            .rentalSlotStart(at(2026, Month.NOVEMBER, 1))
            .rentalSlotEnd(at(2026, Month.NOVEMBER, 3))
            .quantity(null)
            .build();

    long nov1 = ms(at(2026, Month.NOVEMBER, 1));
    long nov3 = ms(at(2026, Month.NOVEMBER, 3));

    assertEquals(0L, minForReservations(1L, List.of(booking), nov1, nov3));
  }

  @Test
  void reservationWithoutDates_isIgnored() {
    InventoryReservation empty =
        InventoryReservation.builder().quantity(1L).build();

    assertTrue(InventoryAvailabilityServiceImpl.reservationToBlockedIntervalMillis(empty).isEmpty());
    assertEquals(
        2L,
        minForReservations(
            2L, List.of(empty), ms(at(2026, Month.DECEMBER, 1)), ms(at(2026, Month.DECEMBER, 5))));
  }
}
