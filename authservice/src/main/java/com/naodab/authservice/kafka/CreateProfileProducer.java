package com.naodab.authservice.kafka;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import com.naodab.authservice.dto.event.CreateProfileEvent;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class CreateProfileProducer {
  KafkaTemplate<String, CreateProfileEvent> kafkaTemplate;

  @NonFinal
  @Value("${spring.kafka.topics.create-profile}")
  String createProfileTopic;

  public void sendCreateProfileEvent(CreateProfileEvent event) {
    log.info("Sending create profile event to topic: {}", createProfileTopic);
    kafkaTemplate.send(createProfileTopic, event)
        .whenComplete((result, ex) -> {
          if (ex != null) {
            log.error("Failed to send create profile event to topic {}: {}", createProfileTopic, ex.getMessage());
          } else {
            log.info("Create profile event sent to topic {} partition {} offset {}", createProfileTopic,
                result.getRecordMetadata().partition(), result.getRecordMetadata().offset());
          }
        });
  }
}
