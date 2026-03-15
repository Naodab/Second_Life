package com.naodab.authservice.kafka;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import com.naodab.authservice.dto.event.ForgotPasswordEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ForgotPasswordProducer {

  KafkaTemplate<String, ForgotPasswordEvent> kafkaTemplate;

  @NonFinal
  @Value("${spring.kafka.topics.forgot-password}")
  private String forgotPasswordTopic;

  public void sendForgotPasswordEvent(ForgotPasswordEvent event) {
    log.info("Sending forgot password event to topic: {}", forgotPasswordTopic);
    kafkaTemplate.send(forgotPasswordTopic, event);
  }
}
