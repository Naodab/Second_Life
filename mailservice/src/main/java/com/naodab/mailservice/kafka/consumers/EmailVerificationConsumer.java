package com.naodab.mailservice.kafka.consumers;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.naodab.mailservice.dto.EmailVerificationEvent;
import com.naodab.mailservice.service.MailService;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import lombok.AccessLevel;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class EmailVerificationConsumer {
  MailService mailService;

  @KafkaListener(topics = "${spring.kafka.topics.email-verification}", groupId = "${spring.kafka.consumer.group-id}", containerFactory = "emailVerificationKafkaListenerContainerFactory")
  public void listen(EmailVerificationEvent event) {
    log.info("Received email verification event: {}", event.getToEmail());
    mailService.sendEmailVerification(event);
  }
}
