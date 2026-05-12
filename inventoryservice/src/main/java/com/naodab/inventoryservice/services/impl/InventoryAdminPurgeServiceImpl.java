package com.naodab.inventoryservice.services.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.naodab.inventoryservice.dto.response.InventoryPurgeStatsResponse;
import com.naodab.inventoryservice.repositories.InventoryItemRepository;
import com.naodab.inventoryservice.repositories.InventoryReservationRepository;
import com.naodab.inventoryservice.services.InventoryAdminPurgeService;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class InventoryAdminPurgeServiceImpl implements InventoryAdminPurgeService {

  InventoryReservationRepository inventoryReservationRepository;
  InventoryItemRepository inventoryItemRepository;

  @Override
  @Transactional
  public InventoryPurgeStatsResponse purgeAllListingLinkedInventory() {
    long resCount = inventoryReservationRepository.count();
    long itemCount = inventoryItemRepository.count();
    inventoryReservationRepository.deleteAllInBatch();
    inventoryItemRepository.deleteAllInBatch();
    return InventoryPurgeStatsResponse.builder()
        .reservationsRemoved(resCount)
        .inventoryItemsRemoved(itemCount)
        .build();
  }
}
