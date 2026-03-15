package com.naodab.authservice.kafka;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;

import com.naodab.authservice.dto.event.EmailVerificationEvent;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class EmailProducerService {

  KafkaTemplate<String, EmailVerificationEvent> kafkaTemplate;

  @NonFinal
  @Value("${spring.kafka.topics.email-verification}")
  private String emailVerificationTopic;

  public void sendEmailVerificationEvent(EmailVerificationEvent event) {
    log.info("Sending email verification event to topic: {}", emailVerificationTopic);
    kafkaTemplate.send(emailVerificationTopic, event)
        .whenComplete((result, ex) -> {
          if (ex != null) {
            log.error("Failed to send email verification event to topic {}: {}", emailVerificationTopic, ex.getMessage());
          } else {
            log.info("Email verification event sent to topic {} partition {} offset {}",
                emailVerificationTopic, result.getRecordMetadata().partition(), result.getRecordMetadata().offset());
          }
        });
  }
}
