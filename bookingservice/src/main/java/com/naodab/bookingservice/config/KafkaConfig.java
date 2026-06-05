package com.naodab.bookingservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.naodab.bookingservice.dto.events.InventoryReservationCreateEvent;
import com.naodab.bookingservice.dto.events.OrderNotificationEvent;

import java.util.HashMap;
import java.util.Map;

import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.support.serializer.JsonSerializer;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.AccessLevel;
import lombok.experimental.NonFinal;

@Configuration
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class KafkaConfig {

  ObjectMapper objectMapper;

  @NonFinal
  @Value("${spring.kafka.bootstrap-servers}")
  String bootstrapServers;

  @NonFinal
  @Value("${spring.kafka.consumer.group-id}")
  String consumerGroupId;

  private <T> ProducerFactory<String, T> producerFactory() {
    Map<String, Object> config = new HashMap<>();
    config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
    config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);

    JsonSerializer<T> serializer = new JsonSerializer<>(objectMapper);
    serializer.setAddTypeInfo(false);

    return new DefaultKafkaProducerFactory<>(
        config,
        new StringSerializer(),
        serializer);
  }

  private <T> KafkaTemplate<String, T> kafkaTemplate() {
    return new KafkaTemplate<>(producerFactory());
  }

  @Bean
  public KafkaTemplate<String, InventoryReservationCreateEvent> inventoryReservationCreateKafkaTemplate() {
    return kafkaTemplate();
  }

  @Bean
  public KafkaTemplate<String, OrderNotificationEvent> orderNotificationKafkaTemplate() {
    return kafkaTemplate();
  }

}
