package com.naodab.inventoryservice.kafka.consumers;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.naodab.inventoryservice.dto.event.CreateInventoryItemsBatchEvent;
import com.naodab.inventoryservice.services.InventoryItemService;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import lombok.AccessLevel;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CreateInventoryItemConsumer {
  InventoryItemService inventoryItemService;

  @KafkaListener(topics = "${spring.kafka.topics.create-inventory-item}", containerFactory = "createInventoryItemsBatchKafkaListenerContainerFactory")
  public void listen(CreateInventoryItemsBatchEvent event) {
    if (event == null || event.getListingVariants() == null || event.getListingVariants().isEmpty()) {
      log.warn("Ignoring empty create-inventory-items batch event");
      return;
    }
    log.info("Consuming create inventory items batch event ({} lines)", event.getListingVariants().size());
    inventoryItemService.createInventoryItemsBatch(event.getListingVariants());
  }
}
