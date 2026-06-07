package com.naodab.authservice.config.initializers;

import com.naodab.authservice.clients.ProfileClient;
import com.naodab.authservice.repositories.AccountRepository;

import org.springframework.stereotype.Component;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.boot.ApplicationArguments;
import org.springframework.util.StringUtils;

import com.naodab.authservice.models.Account;
import com.naodab.authservice.models.Account.Role;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import lombok.experimental.NonFinal;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AdminInitializer implements ApplicationRunner {
  AccountRepository accountRepository;
  PasswordEncoder passwordEncoder;
  ProfileClient profileClient;

  @NonFinal
  @Value("${account.admin.email}")
  String accountAdminEmail;

  @NonFinal
  @Value("${account.admin.password}")
  String accountAdminPassword;

  @Override
  public void run(ApplicationArguments args) throws Exception {
    if (!StringUtils.hasText(accountAdminEmail)) {
      log.warn("Admin bootstrap skipped: account.admin.email is not configured");
      return;
    }

    Account account = accountRepository.findByEmail(accountAdminEmail.trim()).orElseGet(() -> {
      Account created = Account.builder()
          .email(accountAdminEmail.trim())
          .password(passwordEncoder.encode(accountAdminPassword))
          .role(Role.ADMIN)
          .emailVerified(true)
          .build();
      return accountRepository.save(created);
    });

    linkAdminProfileIfMissing(account);
  }

  private void linkAdminProfileIfMissing(Account account) {
    if (account.getRole() != Role.ADMIN || StringUtils.hasText(account.getProfileId())) {
      return;
    }
    profileClient.ensureProfileIdForEmail(account.getEmail(), "Ban", "quản trị")
        .ifPresentOrElse(profileId -> {
          account.setProfileId(profileId);
          accountRepository.save(account);
          log.info("Linked admin account {} to profile {} on startup", account.getEmail(), profileId);
        }, () -> log.warn("Could not link profile for admin {} on startup", account.getEmail()));
  }
}
