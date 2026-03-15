package com.naodab.mailservice.kafka.consumers;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import com.naodab.mailservice.dto.ForgotPasswordEvent;
import com.naodab.mailservice.service.MailService;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import lombok.AccessLevel;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ForgotPasswordConsumer {
  MailService mailService;

  @KafkaListener(topics = "${spring.kafka.topics.forgot-password}", groupId = "${spring.kafka.consumer.group-id}", containerFactory = "forgotPasswordKafkaListenerContainerFactory")
  public void listen(ForgotPasswordEvent event) {
    log.info("Received forgot password event: {}", event.getToEmail());
    mailService.sendForgotPassword(event);
  }
}
