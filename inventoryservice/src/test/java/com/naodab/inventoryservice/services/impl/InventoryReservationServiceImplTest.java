package com.naodab.inventoryservice.services.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.time.Month;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.inventoryservice.dto.event.InventoryReservationCreateEvent;
import com.naodab.inventoryservice.models.InventoryItem;
import com.naodab.inventoryservice.models.InventoryReservation;
import com.naodab.inventoryservice.repositories.InventoryItemRepository;
import com.naodab.inventoryservice.repositories.InventoryReservationRepository;
import com.naodab.inventoryservice.services.InventoryAvailabilityService;

@ExtendWith(MockitoExtension.class)
class InventoryReservationServiceImplTest {

  private static final String RESERVATION_ID = "order-1";
  private static final String LISTING_VARIANT_ID = "variant-1";
  private static final LocalDateTime EXPIRES = LocalDateTime.of(2026, Month.JUNE, 1, 10, 0);

  @Mock
  InventoryReservationRepository inventoryReservationRepository;

  @Mock
  InventoryItemRepository inventoryItemRepository;

  @Mock
  InventoryAvailabilityService inventoryAvailabilityService;

  @InjectMocks
  InventoryReservationServiceImpl inventoryReservationService;

  @Test
  void createBuyReservation_validEvent_savesPendingReservation() {
    when(inventoryReservationRepository.existsById(RESERVATION_ID)).thenReturn(false);
    when(inventoryItemRepository.findByListingVariantIdAndMode(
            LISTING_VARIANT_ID, InventoryItem.InventoryMode.BUY))
        .thenReturn(
            Optional.of(
                InventoryItem.builder().id("item-1").listingVariantId(LISTING_VARIANT_ID).build()));
    when(inventoryAvailabilityService.findAvailableQuantityIfTracked(
            LISTING_VARIANT_ID, InventoryItem.InventoryMode.BUY))
        .thenReturn(Optional.of(5L));

    inventoryReservationService.createBuyReservation(sampleEvent());

    ArgumentCaptor<InventoryReservation> captor = ArgumentCaptor.forClass(InventoryReservation.class);
    verify(inventoryReservationRepository).save(captor.capture());

    InventoryReservation saved = captor.getValue();
    assertThat(saved.getId()).isEqualTo(RESERVATION_ID);
    assertThat(saved.getMode()).isEqualTo(InventoryItem.InventoryMode.BUY);
    assertThat(saved.getQuantity()).isEqualTo(2L);
    assertThat(saved.getStatus()).isEqualTo(InventoryReservation.ReservationStatus.PENDING);
  }

  @Test
  void createBuyReservation_insufficientStock_throws() {
    when(inventoryReservationRepository.existsById(RESERVATION_ID)).thenReturn(false);
    when(inventoryItemRepository.findByListingVariantIdAndMode(
            LISTING_VARIANT_ID, InventoryItem.InventoryMode.BUY))
        .thenReturn(
            Optional.of(
                InventoryItem.builder().id("item-1").listingVariantId(LISTING_VARIANT_ID).build()));
    when(inventoryAvailabilityService.findAvailableQuantityIfTracked(
            LISTING_VARIANT_ID, InventoryItem.InventoryMode.BUY))
        .thenReturn(Optional.of(1L));

    assertThatThrownBy(() -> inventoryReservationService.createBuyReservation(sampleEvent()))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INSUFFICIENT_INVENTORY);

    verify(inventoryReservationRepository, never()).save(any());
  }

  @Test
  void releaseReservation_existing_setsReleased() {
    InventoryReservation existing =
        InventoryReservation.builder()
            .id(RESERVATION_ID)
            .status(InventoryReservation.ReservationStatus.PENDING)
            .build();
    when(inventoryReservationRepository.findById(RESERVATION_ID)).thenReturn(Optional.of(existing));

    inventoryReservationService.releaseReservation(RESERVATION_ID);

    assertThat(existing.getStatus()).isEqualTo(InventoryReservation.ReservationStatus.RELEASED);
    verify(inventoryReservationRepository).save(existing);
  }

  @Test
  void createFromEvent_alreadyExists_skipsSave() {
    when(inventoryReservationRepository.existsById(RESERVATION_ID)).thenReturn(true);

    inventoryReservationService.createFromEvent(sampleEvent());

    verify(inventoryReservationRepository, never()).save(any());
  }

  private static InventoryReservationCreateEvent sampleEvent() {
    return InventoryReservationCreateEvent.builder()
        .inventoryReservationId(RESERVATION_ID)
        .listingVariantId(LISTING_VARIANT_ID)
        .customerId("customer-1")
        .referenceId(RESERVATION_ID)
        .quantity(2)
        .mode("BUY")
        .expiresAt(EXPIRES)
        .build();
  }
}
