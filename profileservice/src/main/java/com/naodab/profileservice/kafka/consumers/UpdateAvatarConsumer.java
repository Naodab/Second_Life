package com.naodab.profileservice.kafka.consumers;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import lombok.extern.slf4j.Slf4j;
import lombok.AccessLevel;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.naodab.profileservice.dto.event.UpdateAvatarEvent;
import com.naodab.profileservice.services.ProfileService;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UpdateAvatarConsumer {
  ProfileService profileService;

  @KafkaListener(topics = "${spring.kafka.topics.update-avatar}", containerFactory = "updateAvatarKafkaListenerContainerFactory")
  public void consume(UpdateAvatarEvent event) {
    log.info("Consuming update avatar event: {}", event);
    profileService.updateAvatarFromEvent(event);
  }
}
