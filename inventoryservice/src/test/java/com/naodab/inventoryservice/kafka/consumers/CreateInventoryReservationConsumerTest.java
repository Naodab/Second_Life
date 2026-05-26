package com.naodab.inventoryservice.kafka.consumers;

import static org.mockito.Mockito.verify;

import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.naodab.inventoryservice.dto.event.InventoryReservationCreateEvent;
import com.naodab.inventoryservice.services.InventoryReservationService;

@ExtendWith(MockitoExtension.class)
class CreateInventoryReservationConsumerTest {

  @Mock
  InventoryReservationService inventoryReservationService;

  @InjectMocks
  CreateInventoryReservationConsumer consumer;

  @Test
  void listen_delegatesToInventoryReservationService() {
    InventoryReservationCreateEvent event =
        InventoryReservationCreateEvent.builder()
            .inventoryReservationId("order-1")
            .listingVariantId("variant-1")
            .quantity(1)
            .mode("BUY")
            .expiresAt(LocalDateTime.of(2026, 6, 1, 10, 0))
            .build();

    consumer.listen(event);

    verify(inventoryReservationService).createFromEvent(event);
  }
}
