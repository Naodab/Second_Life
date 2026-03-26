package com.naodab.profileservice.kafka.producers;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import com.naodab.profileservice.dto.event.ProfileLinkedToAccountEvent;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class ProfileLinkedToAccountProducer {
  KafkaTemplate<String, ProfileLinkedToAccountEvent> kafkaTemplate;

  @NonFinal
  @Value("${spring.kafka.topics.account-profile-linked}")
  String accountProfileLinkedTopic;

  public void send(ProfileLinkedToAccountEvent event) {
    log.debug("Sending profile-linked event for email {}", event != null ? event.getEmail() : null);
    kafkaTemplate.send(accountProfileLinkedTopic, event);
  }
}
