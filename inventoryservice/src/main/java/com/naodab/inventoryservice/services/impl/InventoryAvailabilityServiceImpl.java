package com.naodab.inventoryservice.services.impl;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.TreeSet;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.inventoryservice.models.InventoryItem;
import com.naodab.inventoryservice.models.InventoryReservation;
import com.naodab.inventoryservice.repositories.InventoryItemRepository;
import com.naodab.inventoryservice.repositories.InventoryReservationRepository;
import com.naodab.inventoryservice.services.InventoryAvailabilityService;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class InventoryAvailabilityServiceImpl implements InventoryAvailabilityService {

  static final List<InventoryReservation.ReservationStatus> ACTIVE_RESERVATION_STATUSES = List.of(
      InventoryReservation.ReservationStatus.PENDING,
      InventoryReservation.ReservationStatus.CONFIRMED);

  InventoryItemRepository inventoryItemRepository;
  InventoryReservationRepository inventoryReservationRepository;

  @Override
  @Transactional(readOnly = true)
  public Optional<Long> findAvailableQuantityIfTracked(
      String listingVariantId,
      InventoryItem.InventoryMode mode) {
    return inventoryItemRepository
        .findByListingVariantIdAndMode(listingVariantId, mode)
        .map(
            item -> {
              long physical = physicalQuantityForMode(item);
              long reserved =
                  inventoryReservationRepository.sumActiveReservedQuantity(
                      listingVariantId,
                      mode,
                      ACTIVE_RESERVATION_STATUSES,
                      LocalDateTime.now());
              return Math.max(0L, physical - reserved);
            });
  }

  @Override
  @Transactional(readOnly = true)
  public Optional<Long> findMinAvailableQuantityInOpenInterval(
      String listingVariantId,
      InventoryItem.InventoryMode mode,
      Instant intervalStart,
      Instant intervalEnd) {
    if (intervalStart == null || intervalEnd == null || !intervalEnd.isAfter(intervalStart)) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    Optional<InventoryItem> itemOpt =
        inventoryItemRepository.findByListingVariantIdAndMode(listingVariantId, mode);
    if (itemOpt.isEmpty()) {
      return Optional.empty();
    }
    long physical = physicalQuantityForMode(itemOpt.get());
    if (mode != InventoryItem.InventoryMode.RENT) {
      long reserved =
          inventoryReservationRepository.sumActiveReservedQuantity(
              listingVariantId,
              mode,
              ACTIVE_RESERVATION_STATUSES,
              LocalDateTime.now());
      return Optional.of(Math.max(0L, physical - reserved));
    }

    long q0 = intervalStart.toEpochMilli();
    long q1 = intervalEnd.toEpochMilli();

    List<InventoryReservation> rows =
        inventoryReservationRepository.findRentalPeriodsByListingVariant(
            listingVariantId, mode, ACTIVE_RESERVATION_STATUSES);

    List<long[]> clipped = new ArrayList<>();
    for (InventoryReservation r : rows) {
      long qty = r.getQuantity() == null ? 1L : Math.max(1L, r.getQuantity());
      Optional<long[]> iv = reservationToEpochIntervalMillis(r);
      if (iv.isEmpty()) {
        continue;
      }
      long a = iv.get()[0];
      long b = iv.get()[1];
      if (!(a < q1 && b > q0)) {
        continue;
      }
      clipped.add(new long[] {Math.max(a, q0), Math.min(b, q1), qty});
    }

    TreeSet<Long> points = new TreeSet<>();
    points.add(q0);
    points.add(q1);
    for (long[] c : clipped) {
      points.add(c[0]);
      points.add(c[1]);
    }

    long[] timeline = points.stream().mapToLong(Long::longValue).toArray();
    long minFree = physical;
    for (int i = 0; i < timeline.length - 1; i++) {
      long seg0 = timeline[i];
      long seg1 = timeline[i + 1];
      if (seg1 <= seg0) {
        continue;
      }
      long mid = seg0 + (seg1 - seg0) / 2;
      long used = 0L;
      for (long[] c : clipped) {
        if (mid >= c[0] && mid < c[1]) {
          used += c[2];
        }
      }
      minFree = Math.min(minFree, physical - used);
    }
    return Optional.of(Math.max(0L, minFree));
  }

  static Optional<long[]> reservationToEpochIntervalMillis(InventoryReservation r) {
    if (r.getRentalSlotStart() != null && r.getRentalSlotEnd() != null) {
      LocalDateTime s = r.getRentalSlotStart();
      LocalDateTime e = r.getRentalSlotEnd();
      long a = s.toInstant(ZoneOffset.UTC).toEpochMilli();
      long b = e.toInstant(ZoneOffset.UTC).toEpochMilli();
      if (b > a) {
        return Optional.of(new long[] {a, b});
      }
      return Optional.empty();
    }
    LocalDate rs = r.getRentalStart();
    LocalDate re = r.getRentalEnd();
    if (rs != null && re != null) {
      long a = rs.atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli();
      long b = re.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant().toEpochMilli();
      if (b > a) {
        return Optional.of(new long[] {a, b});
      }
    }
    return Optional.empty();
  }

  @Override
  @Transactional(readOnly = true)
  public long getPhysicalStock(String listingVariantId, InventoryItem.InventoryMode mode) {
    InventoryItem item = inventoryItemRepository
        .findByListingVariantIdAndMode(listingVariantId, mode)
        .orElseThrow(() -> new AppException(ErrorCode.INVENTORY_ITEM_NOT_FOUND));

    return physicalQuantityForMode(item);
  }

  @Override
  @Transactional(readOnly = true)
  public long getReservedQuantity(String listingVariantId, InventoryItem.InventoryMode mode) {
    return inventoryReservationRepository.sumActiveReservedQuantity(
        listingVariantId,
        mode,
        ACTIVE_RESERVATION_STATUSES,
        LocalDateTime.now());
  }

  @Override
  @Transactional(readOnly = true)
  public long getAvailableQuantity(String listingVariantId, InventoryItem.InventoryMode mode) {
    long physical = getPhysicalStock(listingVariantId, mode);
    long reserved = getReservedQuantity(listingVariantId, mode);
    return Math.max(0L, physical - reserved);
  }

  static long physicalQuantityForMode(InventoryItem item) {
    Long raw = item.getMode() == InventoryItem.InventoryMode.BUY
        ? item.getBuyQuantiy()
        : item.getRentQuantity();
    return raw == null ? 0L : raw;
  }
}
