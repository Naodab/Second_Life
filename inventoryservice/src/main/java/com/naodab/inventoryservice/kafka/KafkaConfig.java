package com.naodab.inventoryservice.kafka;

import java.util.HashMap;
import java.util.Map;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.support.serializer.JacksonJsonDeserializer;

import com.naodab.inventoryservice.dto.event.CreateInventoryItemsBatchEvent;
import com.naodab.inventoryservice.dto.event.InventoryReservationCreateEvent;

@Configuration
public class KafkaConfig {

  @Value("${spring.kafka.bootstrap-servers}")
  private String bootstrapServers;

  @Value("${spring.kafka.consumer.group-id}")
  private String consumerGroupId;

  @Value("${spring.kafka.consumer.auto-offset-reset:earliest}")
  private String autoOffsetReset;

  public <T> ConsumerFactory<String, T> consumerFactory(Class<T> type, String groupId) {
    Map<String, Object> config = new HashMap<>();
    config.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
    config.put(ConsumerConfig.GROUP_ID_CONFIG, groupId);
    config.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, autoOffsetReset);
    JacksonJsonDeserializer<T> deserializer = new JacksonJsonDeserializer<>(type);
    deserializer.addTrustedPackages("*");

    return new DefaultKafkaConsumerFactory<>(
        config,
        new StringDeserializer(),
        deserializer);
  }

  public <T> ConcurrentKafkaListenerContainerFactory<String, T> kafkaListenerContainerFactory(
      Class<T> type,
      String groupId) {
    ConcurrentKafkaListenerContainerFactory<String, T> factory = new ConcurrentKafkaListenerContainerFactory<>();
    factory.setConsumerFactory(consumerFactory(type, groupId));
    return factory;
  }

  @Bean
  public ConcurrentKafkaListenerContainerFactory<String, CreateInventoryItemsBatchEvent> createInventoryItemsBatchKafkaListenerContainerFactory() {
    return kafkaListenerContainerFactory(CreateInventoryItemsBatchEvent.class, consumerGroupId);
  }

  @Bean
  public ConcurrentKafkaListenerContainerFactory<String, InventoryReservationCreateEvent> inventoryReservationCreateKafkaListenerContainerFactory() {
    return kafkaListenerContainerFactory(InventoryReservationCreateEvent.class, consumerGroupId);
  }


}
