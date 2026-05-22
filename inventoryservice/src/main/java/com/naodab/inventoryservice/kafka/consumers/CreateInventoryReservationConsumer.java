package com.naodab.inventoryservice.kafka.consumers;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.naodab.inventoryservice.dto.event.InventoryReservationCreateEvent;
import com.naodab.inventoryservice.services.InventoryReservationService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CreateInventoryReservationConsumer {

  InventoryReservationService inventoryReservationService;

  @KafkaListener(
      topics = "${spring.kafka.topics.create-inventory-reservation}",
      containerFactory = "inventoryReservationCreateKafkaListenerContainerFactory")
  public void listen(InventoryReservationCreateEvent event) {
    log.info("Consuming create inventory reservation event id={}", event != null ? event.getInventoryReservationId() : null);
    inventoryReservationService.createFromEvent(event);
  }
}
