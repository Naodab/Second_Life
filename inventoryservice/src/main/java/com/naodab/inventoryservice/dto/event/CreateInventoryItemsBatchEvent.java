package com.naodab.inventoryservice.dto.event;

import java.util.ArrayList;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class CreateInventoryItemsBatchEvent {

  @Builder.Default
  List<InventoryItemCreateRequestEvent> listingVariants = new ArrayList<>();
}
