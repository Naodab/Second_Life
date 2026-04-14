package com.naodab.uploadservice.kafka.producers;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import com.naodab.uploadservice.dto.events.UpdateAvatarEvent;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import lombok.AccessLevel;
import lombok.experimental.NonFinal;
import org.springframework.beans.factory.annotation.Value;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UpdateAvatarProducer {
  KafkaTemplate<String, UpdateAvatarEvent> kafkaTemplate;

  @NonFinal
  @Value("${spring.kafka.topics.update-avatar}")
  String updateAvatarTopic;

  @Async
  public void send(UpdateAvatarEvent event) {
    log.info("Sending update avatar event to topic: {}", updateAvatarTopic);
    kafkaTemplate.send(updateAvatarTopic, event)
        .whenComplete((result, ex) -> {
          if (ex != null) {
            log.error("Failed to send update avatar event to topic {}: {}", updateAvatarTopic, ex.getMessage());
          } else {
            log.info("Update avatar event sent to topic {} partition {} offset {}", updateAvatarTopic,
                result.getRecordMetadata().partition(), result.getRecordMetadata().offset());
          }
        });
  }

}
