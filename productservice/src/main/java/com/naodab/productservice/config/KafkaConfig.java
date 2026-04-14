package com.naodab.productservice.config;

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
import org.springframework.kafka.support.serializer.JsonDeserializer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.naodab.productservice.dto.event.UpdateMainImageFacilityEvent;

@Configuration
public class KafkaConfig {

  @Value("${spring.kafka.bootstrap-servers}")
  private String bootstrapServers;

  @Value("${spring.kafka.consumer.group-id}")
  private String consumerGroupId;

  private ObjectMapper objectMapper() {
    ObjectMapper objectMapper = new ObjectMapper();
    objectMapper.registerModule(new JavaTimeModule());
    objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    return objectMapper;
  }

  private <T> ConsumerFactory<String, T> consumerFactory(Class<T> type, String groupId) {
    Map<String, Object> config = new HashMap<>();
    config.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
    config.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
    config.put(ConsumerConfig.GROUP_ID_CONFIG, groupId);
    JsonDeserializer<T> deserializer = new JsonDeserializer<>(type, objectMapper());
    deserializer.addTrustedPackages("*");

    return new DefaultKafkaConsumerFactory<>(
        config,
        new StringDeserializer(),
        deserializer);
  }

  private <T> ConcurrentKafkaListenerContainerFactory<String, T> kafkaListenerContainerFactory(Class<T> type,
      String groupId) {
    ConcurrentKafkaListenerContainerFactory<String, T> factory = new ConcurrentKafkaListenerContainerFactory<>();
    factory.setConsumerFactory(consumerFactory(type, groupId));
    return factory;
  }

  @Bean
  public ConcurrentKafkaListenerContainerFactory<String, UpdateMainImageFacilityEvent> updateMainImageFacilityKafkaListenerContainerFactory() {
    return kafkaListenerContainerFactory(UpdateMainImageFacilityEvent.class, consumerGroupId);
  }

}
