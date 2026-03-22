package com.naodab.profileservice.kafka.producers;

import org.springframework.kafka.core.KafkaTemplate;

import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;

import com.naodab.profileservice.dto.event.UploadAvatarEvent;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class UploadAvatarProducer {
  KafkaTemplate<String, UploadAvatarEvent> kafkaTemplate;

  @NonFinal
  @Value("${spring.kafka.topics.upload-avatar}")
  String uploadAvatarTopic;

  public void sendUploadAvatarEvent(UploadAvatarEvent event) {
    log.info("Sending upload avatar event to topic: {}", uploadAvatarTopic);
    kafkaTemplate.send(uploadAvatarTopic, event);
  }
}
