package com.naodab.inventoryservice.services;

import com.naodab.inventoryservice.dto.response.InventoryPurgeStatsResponse;

public interface InventoryAdminPurgeService {

  /** Hard-deletes all reservations and inventory items (listing-linked stock). */
  InventoryPurgeStatsResponse purgeAllListingLinkedInventory();
}
