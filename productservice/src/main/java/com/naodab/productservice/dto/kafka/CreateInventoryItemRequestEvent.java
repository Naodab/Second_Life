package com.naodab.productservice.dto.kafka;

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
public class CreateInventoryItemRequestEvent {

  @Builder.Default
  List<ListingVariantInventoryLine> listingVariants = new ArrayList<>();

  @Getter
  @Setter
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  @FieldDefaults(level = lombok.AccessLevel.PRIVATE)
  public static class ListingVariantInventoryLine {
    String listingVariantId;
    Long buyQuantity;
    Long rentQuantity;
    ListingInventoryMode mode;
  }

  public enum ListingInventoryMode {
    BUY,
    RENT,
  }
}
