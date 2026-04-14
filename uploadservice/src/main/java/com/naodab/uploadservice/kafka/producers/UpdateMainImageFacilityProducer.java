package com.naodab.uploadservice.kafka.producers;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import com.naodab.uploadservice.dto.events.UpdateMainImageFacilityEvent;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class UpdateMainImageFacilityProducer {
  KafkaTemplate<String, UpdateMainImageFacilityEvent> kafkaTemplate;

  @NonFinal
  @Value("${spring.kafka.topics.update-main-image-facility}")
  String updateMainImageFacilityTopic;

  public void send(UpdateMainImageFacilityEvent event) {
    log.debug("Sending update main image facility event to topic: {}", updateMainImageFacilityTopic);
    kafkaTemplate.send(updateMainImageFacilityTopic, event)
        .whenComplete((result, ex) -> {
          if (ex != null) {
            log.error("Failed to send update main image facility event to topic {}: {}", updateMainImageFacilityTopic,
                ex.getMessage());
          } else {
            log.info("Upload main image facility event sent to topic {} partition {} offset {}",
                updateMainImageFacilityTopic, result.getRecordMetadata().partition(),
                result.getRecordMetadata().offset());
          }
        });
  }
}
