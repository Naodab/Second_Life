package com.naodab.bookingservice.kafka.producers;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.naodab.commonservice.event.OrderNotificationEvent;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderNotificationProducer {

  KafkaTemplate<String, OrderNotificationEvent> kafkaTemplate;

  @NonFinal
  @Value("${spring.kafka.topics.order-notification}")
  String orderNotificationTopic;

  public void send(OrderNotificationEvent event) {
    if (event == null || !StringUtils.hasText(event.getRecipientProfileId())) {
      return;
    }
    String key = event.getRecipientProfileId().trim();
    kafkaTemplate
        .send(orderNotificationTopic, key, event)
        .whenComplete(
            (result, ex) -> {
              if (ex != null) {
                log.error(
                    "Failed to send order notification for order {} to {}: {}",
                    event.getOrderId(),
                    key,
                    ex.getMessage());
              } else if (result != null) {
                log.info(
                    "Order notification sent for order {} to profile {} partition {} offset {}",
                    event.getOrderId(),
                    key,
                    result.getRecordMetadata().partition(),
                    result.getRecordMetadata().offset());
              }
            });
  }
}
