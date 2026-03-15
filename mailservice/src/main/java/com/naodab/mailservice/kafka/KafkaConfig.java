package com.naodab.mailservice.kafka;

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
import com.naodab.mailservice.dto.EmailVerificationEvent;
import com.naodab.mailservice.dto.ForgotPasswordEvent;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;

@Configuration
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class KafkaConfig {

  @NonFinal
  @Value("${spring.kafka.bootstrap-servers}")
  String bootstrapServers;

  @NonFinal
  @Value("${spring.kafka.consumer.group-id}")
  String consumerGroupId;

  @Bean
  public ObjectMapper objectMapper() {
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
    deserializer.setUseTypeHeaders(false);

    return new DefaultKafkaConsumerFactory<>(
        config,
        new StringDeserializer(),
        deserializer);
  }

  @SuppressWarnings("null")
  public <T> ConcurrentKafkaListenerContainerFactory<String, T> kafkaListenerContainerFactory(
      Class<T> type,
      String groupId) {
    ConcurrentKafkaListenerContainerFactory<String, T> factory = new ConcurrentKafkaListenerContainerFactory<>();
    ConsumerFactory<String, T> cf = consumerFactory(type, groupId);
    factory.setConsumerFactory(cf);
    return factory;
  }

  @Bean
  public ConcurrentKafkaListenerContainerFactory<String, EmailVerificationEvent> emailVerificationKafkaListenerContainerFactory() {
    return kafkaListenerContainerFactory(EmailVerificationEvent.class, consumerGroupId);
  }

  @Bean
  public ConcurrentKafkaListenerContainerFactory<String, ForgotPasswordEvent> forgotPasswordKafkaListenerContainerFactory() {
    return kafkaListenerContainerFactory(ForgotPasswordEvent.class, consumerGroupId);
  }
}
