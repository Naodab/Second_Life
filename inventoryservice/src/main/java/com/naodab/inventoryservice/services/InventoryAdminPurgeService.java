package com.naodab.inventoryservice.services;

import com.naodab.inventoryservice.dto.response.InventoryPurgeStatsResponse;

public interface InventoryAdminPurgeService {
  InventoryPurgeStatsResponse purgeAllListingLinkedInventory();
}
