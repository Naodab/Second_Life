package com.naodab.inventoryservice.services.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

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
