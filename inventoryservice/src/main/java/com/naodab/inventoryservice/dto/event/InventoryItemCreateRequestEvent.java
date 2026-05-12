package com.naodab.inventoryservice.dto.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import com.naodab.inventoryservice.models.InventoryItem;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class InventoryItemCreateRequestEvent {
  String listingVariantId;
  Long buyQuantity;
  Long rentQuantity;
  InventoryItem.InventoryMode mode;
}
