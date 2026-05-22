package com.naodab.inventoryservice.services.impl;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.inventoryservice.dto.response.RentalPeriodResponse;
import com.naodab.inventoryservice.models.InventoryItem;
import com.naodab.inventoryservice.models.InventoryReservation;
import com.naodab.inventoryservice.repositories.InventoryReservationRepository;
import com.naodab.inventoryservice.services.InventoryRentalPeriodService;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class InventoryRentalPeriodServiceImpl implements InventoryRentalPeriodService {

  static final List<InventoryReservation.ReservationStatus> BOOKED_STATUSES = List.of(
      InventoryReservation.ReservationStatus.PENDING,
      InventoryReservation.ReservationStatus.CONFIRMED);

  InventoryReservationRepository inventoryReservationRepository;

  @Override
  @Transactional(readOnly = true)
  public List<RentalPeriodResponse> listBookedRentalPeriods(String listingVariantId) {
    if (listingVariantId == null || listingVariantId.isBlank()) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }

    return inventoryReservationRepository
        .findRentalPeriodsByListingVariant(
            listingVariantId, InventoryItem.InventoryMode.RENT, BOOKED_STATUSES, LocalDateTime.now())
        .stream()
        .map(this::toResponse)
        .toList();
  }

  RentalPeriodResponse toResponse(InventoryReservation r) {
    return RentalPeriodResponse.builder()
        .reservationId(r.getId())
        .rentalStart(r.getRentalStart())
        .rentalEnd(r.getRentalEnd())
        .slotStart(r.getRentalSlotStart())
        .slotEnd(r.getRentalSlotEnd())
        .quantity(r.getQuantity())
        .status(r.getStatus())
        .build();
  }
}
