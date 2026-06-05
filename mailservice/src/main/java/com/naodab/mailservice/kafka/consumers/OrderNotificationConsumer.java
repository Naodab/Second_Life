package com.naodab.mailservice.kafka.consumers;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.naodab.commonservice.event.OrderNotificationEvent;
import com.naodab.mailservice.service.NotificationService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderNotificationConsumer {

  NotificationService notificationService;

  @KafkaListener(
      topics = "${spring.kafka.topics.order-notification}",
      groupId = "${spring.kafka.consumer.group-id}",
      containerFactory = "orderNotificationKafkaListenerContainerFactory")
  public void listen(OrderNotificationEvent event) {
    log.info(
        "Received order notification {} for profile {}",
        event != null ? event.getKind() : null,
        event != null ? event.getRecipientProfileId() : null);
    notificationService.createFromOrderEvent(event);
  }
}
