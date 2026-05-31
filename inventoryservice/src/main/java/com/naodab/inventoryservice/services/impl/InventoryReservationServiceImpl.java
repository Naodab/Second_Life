package com.naodab.inventoryservice.services.impl;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.inventoryservice.dto.event.InventoryReservationCreateEvent;
import com.naodab.inventoryservice.models.InventoryItem;
import com.naodab.inventoryservice.models.InventoryReservation;
import com.naodab.inventoryservice.repositories.InventoryItemRepository;
import com.naodab.inventoryservice.repositories.InventoryReservationRepository;
import com.naodab.inventoryservice.services.InventoryAvailabilityService;
import com.naodab.inventoryservice.services.InventoryReservationService;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class InventoryReservationServiceImpl implements InventoryReservationService {

  InventoryReservationRepository inventoryReservationRepository;
  InventoryItemRepository inventoryItemRepository;
  InventoryAvailabilityService inventoryAvailabilityService;

  @Override
  @Transactional
  public void createBuyReservation(InventoryReservationCreateEvent event) {
    validateCreateEvent(event);

    String reservationId = event.getInventoryReservationId().trim();
    if (inventoryReservationRepository.existsById(reservationId)) {
      log.debug("Inventory reservation {} already exists, skipping", reservationId);
      return;
    }

    InventoryItem.InventoryMode mode = parseMode(event.getMode());
    if (mode != InventoryItem.InventoryMode.BUY) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }

    String listingVariantId = event.getListingVariantId().trim();
    Optional<InventoryItem> item =
        inventoryItemRepository.findByListingVariantIdAndMode(listingVariantId, mode);
    if (item.isEmpty()) {
      throw new AppException(ErrorCode.INVENTORY_ITEM_NOT_FOUND);
    }

    long requestedQty = event.getQuantity();
    Optional<Long> available =
        inventoryAvailabilityService.findAvailableQuantityIfTracked(listingVariantId, mode);
    if (available.isEmpty() || available.get() < requestedQty) {
      throw new AppException(ErrorCode.INSUFFICIENT_INVENTORY);
    }

    InventoryReservation reservation =
        InventoryReservation.builder()
            .id(reservationId)
            .listingVariantId(listingVariantId)
            .mode(mode)
            .quantity(requestedQty)
            .status(InventoryReservation.ReservationStatus.PENDING)
            .referenceId(
                StringUtils.hasText(event.getReferenceId())
                    ? event.getReferenceId().trim()
                    : reservationId)
            .expiresAt(event.getExpiresAt())
            .build();

    inventoryReservationRepository.save(reservation);
    log.info(
        "Created BUY reservation {} qty={} listingVariantId={}",
        reservation.getId(),
        reservation.getQuantity(),
        reservation.getListingVariantId());
  }

  @Override
  @Transactional
  public void createRentReservation(InventoryReservationCreateEvent event) {
    validateCreateEvent(event);

    String reservationId = event.getInventoryReservationId().trim();
    if (inventoryReservationRepository.existsById(reservationId)) {
      log.debug("Inventory reservation {} already exists, skipping", reservationId);
      return;
    }

    InventoryItem.InventoryMode mode = parseMode(event.getMode());
    if (mode != InventoryItem.InventoryMode.RENT) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }

    if (event.getRentalSlotStart() == null
        || event.getRentalSlotEnd() == null
        || !event.getRentalSlotEnd().isAfter(event.getRentalSlotStart())) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }

    String listingVariantId = event.getListingVariantId().trim();
    Optional<InventoryItem> item =
        inventoryItemRepository.findByListingVariantIdAndMode(listingVariantId, mode);
    if (item.isEmpty()) {
      throw new AppException(ErrorCode.INVENTORY_ITEM_NOT_FOUND);
    }

    long requestedQty = event.getQuantity();
    Instant intervalStart = event.getRentalSlotStart().toInstant(ZoneOffset.UTC);
    Instant intervalEnd = event.getRentalSlotEnd().toInstant(ZoneOffset.UTC);
    inventoryAvailabilityService.requireAvailableQuantityInOpenInterval(
        listingVariantId, mode, intervalStart, intervalEnd, requestedQty);

    InventoryReservation reservation =
        InventoryReservation.builder()
            .id(reservationId)
            .listingVariantId(listingVariantId)
            .mode(mode)
            .quantity(requestedQty)
            .status(InventoryReservation.ReservationStatus.PENDING)
            .referenceId(
                StringUtils.hasText(event.getReferenceId())
                    ? event.getReferenceId().trim()
                    : reservationId)
            .expiresAt(event.getExpiresAt())
            .rentalSlotStart(event.getRentalSlotStart())
            .rentalSlotEnd(event.getRentalSlotEnd())
            .build();

    inventoryReservationRepository.save(reservation);
    log.info(
        "Created RENT reservation {} qty={} listingVariantId={} slot=[{}, {}]",
        reservation.getId(),
        reservation.getQuantity(),
        reservation.getListingVariantId(),
        reservation.getRentalSlotStart(),
        reservation.getRentalSlotEnd());
  }

  @Override
  @Transactional
  public void releaseReservation(String reservationId) {
    if (!StringUtils.hasText(reservationId)) {
      return;
    }
    inventoryReservationRepository
        .findById(reservationId.trim())
        .ifPresent(
            r -> {
              if (r.getStatus() == InventoryReservation.ReservationStatus.RELEASED) {
                return;
              }
              r.setStatus(InventoryReservation.ReservationStatus.RELEASED);
              inventoryReservationRepository.save(r);
              log.info("Released inventory reservation {}", r.getId());
            });
  }

  @Override
  @Transactional
  public void createFromEvent(InventoryReservationCreateEvent event) {
    try {
      InventoryItem.InventoryMode mode = parseMode(event != null ? event.getMode() : null);
      if (mode == InventoryItem.InventoryMode.RENT) {
        createRentReservation(event);
      } else {
        createBuyReservation(event);
      }
    } catch (AppException e) {
      log.warn(
          "Failed to create inventory reservation from event id={}: {}",
          event != null ? event.getInventoryReservationId() : null,
          e.getMessage());
      throw e;
    }
  }

  private static void validateCreateEvent(InventoryReservationCreateEvent event) {
    if (event == null || !StringUtils.hasText(event.getInventoryReservationId())) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    if (!StringUtils.hasText(event.getListingVariantId())
        || event.getQuantity() == null
        || event.getQuantity() < 1) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
  }

  private static InventoryItem.InventoryMode parseMode(String modeRaw) {
    if (!StringUtils.hasText(modeRaw)) {
      return InventoryItem.InventoryMode.BUY;
    }
    return InventoryItem.InventoryMode.valueOf(modeRaw.trim().toUpperCase());
  }
}
