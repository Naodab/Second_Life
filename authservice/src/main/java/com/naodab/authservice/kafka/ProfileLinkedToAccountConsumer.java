package com.naodab.authservice.kafka;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.naodab.authservice.dto.event.ProfileLinkedToAccountEvent;
import com.naodab.authservice.repositories.AccountRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class ProfileLinkedToAccountConsumer {
  AccountRepository accountRepository;

  @KafkaListener(topics = "${spring.kafka.topics.account-profile-linked}", containerFactory = "profileLinkedToAccountKafkaListenerContainerFactory")
  @Transactional
  public void consume(ProfileLinkedToAccountEvent event) {
    if (event == null || !StringUtils.hasText(event.getEmail()) || !StringUtils.hasText(event.getProfileId())) {
      return;
    }

    accountRepository.findByEmail(event.getEmail()).ifPresentOrElse(
        account -> {
          account.setProfileId(event.getProfileId());
          accountRepository.save(account);
        },
        () -> log.warn("No account for email {} when linking profile {}", event.getEmail(), event.getProfileId()));
  }
}
