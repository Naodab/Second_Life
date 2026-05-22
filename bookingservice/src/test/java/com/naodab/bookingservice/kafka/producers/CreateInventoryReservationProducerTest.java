package com.naodab.bookingservice.kafka.producers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.concurrent.CompletableFuture;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import com.naodab.bookingservice.dto.events.InventoryReservationCreateEvent;

@ExtendWith(MockitoExtension.class)
class CreateInventoryReservationProducerTest {

  private static final String TOPIC = "inventory.reservation.create";

  @Mock
  KafkaTemplate<String, InventoryReservationCreateEvent> kafkaTemplate;

  CreateInventoryReservationProducer producer;

  @BeforeEach
  void setUp() {
    producer = new CreateInventoryReservationProducer(kafkaTemplate);
    ReflectionTestUtils.setField(producer, "createInventoryReservationTopic", TOPIC);
  }

  @Test
  void sendCreateInventoryReservationEvent_validEvent_sendsWithListingVariantKey() {
    InventoryReservationCreateEvent event = sampleEvent("variant-1");
    when(kafkaTemplate.send(eq(TOPIC), eq("variant-1"), eq(event)))
        .thenReturn(CompletableFuture.completedFuture(null));

    producer.sendCreateInventoryReservationEvent(event);

    verify(kafkaTemplate).send(TOPIC, "variant-1", event);
  }

  @Test
  void sendCreateInventoryReservationEvent_missingListingVariantId_doesNotSend() {
    InventoryReservationCreateEvent event =
        InventoryReservationCreateEvent.builder()
            .inventoryReservationId("order-1")
            .listingVariantId("  ")
            .build();

    producer.sendCreateInventoryReservationEvent(event);

    verify(kafkaTemplate, never()).send(any(), any(), any());
  }

  @Test
  void sendCreateInventoryReservationEvent_nullEvent_doesNotSend() {
    producer.sendCreateInventoryReservationEvent(null);
    verify(kafkaTemplate, never()).send(any(), any(), any());
  }

  private static InventoryReservationCreateEvent sampleEvent(String listingVariantId) {
    return InventoryReservationCreateEvent.builder()
        .inventoryReservationId("order-1")
        .listingVariantId(listingVariantId)
        .customerId("customer-1")
        .referenceId("order-1")
        .quantity(1)
        .mode("BUY")
        .expiresAt(LocalDateTime.of(2026, 6, 1, 10, 0))
        .build();
  }
}
