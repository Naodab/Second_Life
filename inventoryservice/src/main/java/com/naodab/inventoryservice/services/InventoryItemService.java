package com.naodab.inventoryservice.services;

import java.util.List;

import com.naodab.inventoryservice.dto.event.InventoryItemCreateRequestEvent;

public interface InventoryItemService {

  void createInventoryItem(InventoryItemCreateRequestEvent event);

  void createInventoryItemsBatch(List<InventoryItemCreateRequestEvent> items);

  void deleteInventoryItem(String id);
}
