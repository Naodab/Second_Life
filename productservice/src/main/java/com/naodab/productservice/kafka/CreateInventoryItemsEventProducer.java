package com.naodab.productservice.kafka;

import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import com.naodab.productservice.dto.kafka.CreateInventoryItemRequestEvent;
import com.naodab.productservice.dto.kafka.CreateInventoryItemRequestEvent.ListingInventoryMode;
import com.naodab.productservice.dto.kafka.CreateInventoryItemRequestEvent.ListingVariantInventoryLine;
import com.naodab.productservice.models.Listing;
import com.naodab.productservice.models.ListingVariant;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class CreateInventoryItemsEventProducer {

  private final KafkaTemplate<String, CreateInventoryItemRequestEvent> createInventoryItemRequestKafkaTemplate;

  @Value("${spring.kafka.topics.create-inventory-item}")
  private String createInventoryTopic;

  public void publishForNewListing(String listingId, Listing.ListingType listingType,
      List<ListingVariant> savedVariants) {
    if (savedVariants == null || savedVariants.isEmpty()) {
      return;
    }
    List<ListingVariantInventoryLine> rows = new ArrayList<>();
    for (ListingVariant lv : savedVariants) {
      if (lv == null || lv.getId() == null || lv.getId().isBlank()) {
        continue;
      }
      Long q = lv.getQuantity() != null ? lv.getQuantity() : 0L;
      ListingInventoryMode mode = listingType == Listing.ListingType.RENT ? ListingInventoryMode.RENT
          : ListingInventoryMode.BUY;
      long buy = listingType == Listing.ListingType.BUY ? q : 0L;
      long rent = listingType == Listing.ListingType.RENT ? q : 0L;
      rows.add(
          ListingVariantInventoryLine.builder()
              .listingVariantId(lv.getId())
              .buyQuantity(buy)
              .rentQuantity(rent)
              .mode(mode)
              .build());
    }
    if (rows.isEmpty()) {
      return;
    }
    CreateInventoryItemRequestEvent payload = CreateInventoryItemRequestEvent.builder().listingVariants(rows).build();

    log.debug("Publishing {} inventory variant line(s) for listing {}", rows.size(), listingId);
    createInventoryItemRequestKafkaTemplate.send(createInventoryTopic, listingId, payload)
        .whenComplete(
            (r, ex) -> {
              if (ex != null) {
                log.error("Failed to publish create-inventory-items for listing {}", listingId, ex);
              }
            });
  }
}
