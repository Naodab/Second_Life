package com.naodab.profileservice.kafka.consumers;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.naodab.profileservice.dto.event.CreateProfileEvent;
import com.naodab.profileservice.services.ProfileService;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import lombok.AccessLevel;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CreateProfileConsumer {
  ProfileService profileService;

  @KafkaListener(topics = "${spring.kafka.topics.create-profile}", containerFactory = "createProfileKafkaListenerContainerFactory")
  public void consume(CreateProfileEvent event) {
    log.info("Consuming create profile event: {}", event);
    profileService.createProfileFromEvent(event);
  }
}
