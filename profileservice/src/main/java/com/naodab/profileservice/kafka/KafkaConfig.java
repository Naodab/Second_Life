package com.naodab.profileservice.kafka;

import java.util.HashMap;
import java.util.Map;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.kafka.support.serializer.JsonSerializer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.naodab.profileservice.dto.event.CreateProfileEvent;
import com.naodab.profileservice.dto.event.ProfileLinkedToAccountEvent;
import com.naodab.profileservice.dto.event.UpdateAvatarEvent;
import com.naodab.profileservice.dto.event.UploadAvatarEvent;

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

  public <T> ConsumerFactory<String, T> consumerFactory(Class<T> type, String groupId) {
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

  private <T> ProducerFactory<String, T> producerFactory(Class<T> type) {
    Map<String, Object> config = new HashMap<>();
    config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
    config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);

    JsonSerializer<T> serializer = new JsonSerializer<>(objectMapper());
    serializer.setAddTypeInfo(false);

    return new DefaultKafkaProducerFactory<String, T>(
        config,
        new StringSerializer(),
        serializer);
  }

  private <T> KafkaTemplate<String, T> kafkaTemplate(Class<T> type) {
    return new KafkaTemplate<>(producerFactory(type));
  }

  public <T> ConcurrentKafkaListenerContainerFactory<String, T> kafkaListenerContainerFactory(
      Class<T> type,
      String groupId) {
    ConcurrentKafkaListenerContainerFactory<String, T> factory = new ConcurrentKafkaListenerContainerFactory<>();
    factory.setConsumerFactory(consumerFactory(type, groupId));
    return factory;
  }

  @Bean
  public ConcurrentKafkaListenerContainerFactory<String, CreateProfileEvent> createProfileKafkaListenerContainerFactory() {
    return kafkaListenerContainerFactory(CreateProfileEvent.class, consumerGroupId);
  }

  @Bean
  public ConcurrentKafkaListenerContainerFactory<String, UpdateAvatarEvent> updateAvatarKafkaListenerContainerFactory() {
    return kafkaListenerContainerFactory(UpdateAvatarEvent.class, consumerGroupId);
  }

  @Bean
  public KafkaTemplate<String, UploadAvatarEvent> uploadAvatarKafkaTemplate() {
    return kafkaTemplate(UploadAvatarEvent.class);
  }

  @Bean
  public KafkaTemplate<String, ProfileLinkedToAccountEvent> profileLinkedToAccountKafkaTemplate() {
    return kafkaTemplate(ProfileLinkedToAccountEvent.class);
  }
}
