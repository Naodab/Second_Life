package com.naodab.inventoryservice.services;

import java.time.Instant;
import java.util.Optional;

import com.naodab.inventoryservice.models.InventoryItem;

public interface InventoryAvailabilityService {

  Optional<Long> findAvailableQuantityIfTracked(String listingVariantId, InventoryItem.InventoryMode mode);

  Optional<Long> findMinAvailableQuantityInOpenInterval(
      String listingVariantId,
      InventoryItem.InventoryMode mode,
      Instant intervalStart,
      Instant intervalEnd);

  long getPhysicalStock(String listingVariantId, InventoryItem.InventoryMode mode);

  long getReservedQuantity(String listingVariantId, InventoryItem.InventoryMode mode);

  long getAvailableQuantity(String listingVariantId, InventoryItem.InventoryMode mode);
}
