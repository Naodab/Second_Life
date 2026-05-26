package com.naodab.inventoryservice.services.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.inventoryservice.models.InventoryItem;
import com.naodab.inventoryservice.repositories.InventoryItemRepository;
import com.naodab.inventoryservice.repositories.InventoryReservationRepository;

@ExtendWith(MockitoExtension.class)
class InventoryAvailabilityServiceImplRequireQuantityTest {

  static final String VARIANT_ID = "lv-1";

  @Mock
  InventoryItemRepository inventoryItemRepository;

  @Mock
  InventoryReservationRepository inventoryReservationRepository;

  @InjectMocks
  InventoryAvailabilityServiceImpl service;

  @Test
  void requireAvailableQuantity_whenRequestedExceedsAvailable_throwsInsufficient() {
    InventoryItem item =
        InventoryItem.builder()
            .listingVariantId(VARIANT_ID)
            .mode(InventoryItem.InventoryMode.BUY)
            .buyQuantiy(5L)
            .build();
    when(inventoryItemRepository.existsByListingVariantIdAndMode(
            VARIANT_ID, InventoryItem.InventoryMode.BUY))
        .thenReturn(true);
    when(inventoryItemRepository.findByListingVariantIdAndMode(
            VARIANT_ID, InventoryItem.InventoryMode.BUY))
        .thenReturn(Optional.of(item));
    when(inventoryReservationRepository.sumActiveReservedQuantity(
            org.mockito.ArgumentMatchers.any(),
            org.mockito.ArgumentMatchers.any(),
            org.mockito.ArgumentMatchers.any(),
            org.mockito.ArgumentMatchers.any()))
        .thenReturn(0L);

    assertThatThrownBy(() -> service.requireAvailableQuantity(VARIANT_ID, InventoryItem.InventoryMode.BUY, 6L))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INSUFFICIENT_INVENTORY);
  }

  @Test
  void requireAvailableQuantity_whenInventoryMissing_throwsNotFound() {
    when(inventoryItemRepository.existsByListingVariantIdAndMode(
            VARIANT_ID, InventoryItem.InventoryMode.BUY))
        .thenReturn(false);

    assertThatThrownBy(() -> service.requireAvailableQuantity(VARIANT_ID, InventoryItem.InventoryMode.BUY, 1L))
        .isInstanceOf(AppException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVENTORY_ITEM_NOT_FOUND);
  }

  @Test
  void requireAvailableQuantity_whenOk_returnsAvailable() {
    InventoryItem item =
        InventoryItem.builder()
            .listingVariantId(VARIANT_ID)
            .mode(InventoryItem.InventoryMode.BUY)
            .buyQuantiy(3L)
            .build();
    when(inventoryItemRepository.existsByListingVariantIdAndMode(
            VARIANT_ID, InventoryItem.InventoryMode.BUY))
        .thenReturn(true);
    when(inventoryItemRepository.findByListingVariantIdAndMode(
            VARIANT_ID, InventoryItem.InventoryMode.BUY))
        .thenReturn(Optional.of(item));
    when(inventoryReservationRepository.sumActiveReservedQuantity(
            org.mockito.ArgumentMatchers.any(),
            org.mockito.ArgumentMatchers.any(),
            org.mockito.ArgumentMatchers.any(),
            org.mockito.ArgumentMatchers.any()))
        .thenReturn(0L);

    assertThat(service.requireAvailableQuantity(VARIANT_ID, InventoryItem.InventoryMode.BUY, 2L)).isEqualTo(3L);
  }
}
