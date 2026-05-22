package com.naodab.bookingservice.kafka.producers;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.naodab.bookingservice.dto.events.InventoryReservationCreateEvent;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class CreateInventoryReservationProducer {
  KafkaTemplate<String, InventoryReservationCreateEvent> kafkaTemplate;

  @NonFinal
  @Value("${spring.kafka.topics.create-inventory-reservation}")
  String createInventoryReservationTopic;

  public void sendCreateInventoryReservationEvent(InventoryReservationCreateEvent event) {
    if (event == null || !StringUtils.hasText(event.getListingVariantId())) {
      log.warn("Skipping create inventory reservation event: missing listingVariantId");
      return;
    }
    String key = event.getListingVariantId().trim();
    kafkaTemplate
        .send(createInventoryReservationTopic, key, event)
        .whenComplete(
            (result, ex) -> {
              if (ex != null) {
                log.error(
                    "Failed to send create inventory reservation event to topic {}: {}",
                    createInventoryReservationTopic,
                    ex.getMessage());
                return;
              }
              if (result == null || result.getRecordMetadata() == null) {
                log.warn(
                    "Create inventory reservation event sent to topic {} but metadata missing",
                    createInventoryReservationTopic);
                return;
              }
              log.info(
                  "Create inventory reservation event sent to topic {} partition {} offset {}",
                  createInventoryReservationTopic,
                  result.getRecordMetadata().partition(),
                  result.getRecordMetadata().offset());
            });
  }
}
