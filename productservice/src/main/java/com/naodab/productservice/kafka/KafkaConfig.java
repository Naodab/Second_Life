package com.naodab.productservice.kafka;

import java.util.HashMap;
import java.util.Map;

import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.support.serializer.JsonSerializer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.naodab.productservice.dto.kafka.CreateInventoryItemRequestEvent;

@Configuration
public class KafkaConfig {

  @Value("${spring.kafka.bootstrap-servers}")
  private String bootstrapServers;

  private static ObjectMapper objectMapper() {
    ObjectMapper mapper = new ObjectMapper();
    mapper.registerModule(new JavaTimeModule());
    mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    return mapper;
  }

  private <T> ProducerFactory<String, T> producerFactory(Class<T> type) {
    Map<String, Object> config = new HashMap<>();
    config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
    config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);

    JsonSerializer<T> serializer = new JsonSerializer<>(objectMapper());
    serializer.setAddTypeInfo(false);

    return new DefaultKafkaProducerFactory<>(
        config,
        new StringSerializer(),
        serializer);
  }

  private <T> KafkaTemplate<String, T> kafkaTemplate(Class<T> type) {
    return new KafkaTemplate<>(producerFactory(type));
  }

  @Bean
  public KafkaTemplate<String, CreateInventoryItemRequestEvent> createInventoryItemRequestKafkaTemplate() {
    return kafkaTemplate(CreateInventoryItemRequestEvent.class);
  }
}
