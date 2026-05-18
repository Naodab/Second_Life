package com.naodab.inventoryservice.repositories;

import java.util.List;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.naodab.inventoryservice.models.InventoryItem;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, String> {
  boolean existsByListingVariantIdAndMode(String listingVariantId, InventoryItem.InventoryMode mode);

  Optional<InventoryItem> findByListingVariantIdAndMode(String listingVariantId, InventoryItem.InventoryMode mode);

  List<InventoryItem> findByListingVariantId(String listingVariantId);

}
