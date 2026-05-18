package com.naodab.inventoryservice.mapper;

import org.springframework.stereotype.Component;

import com.naodab.inventoryservice.dto.event.InventoryItemCreateRequestEvent;
import com.naodab.inventoryservice.models.InventoryItem;

@Component
public class InventoryItemMapper {

  public InventoryItem toInventoryItem(InventoryItemCreateRequestEvent request) {
    return InventoryItem.builder()
        .listingVariantId(request.getListingVariantId())
        .buyQuantiy(request.getBuyQuantity())
        .rentQuantity(request.getRentQuantity())
        .mode(request.getMode())
        .build();
  }
}
