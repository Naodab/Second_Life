package com.naodab.authservice.config.initializers;

import com.naodab.authservice.repositories.AccountRepository;

import org.springframework.stereotype.Component;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.boot.ApplicationArguments;

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

  @NonFinal
  @Value("${account.admin.email}")
  String accountAdminEmail;

  @NonFinal
  @Value("${account.admin.password}")
  String accountAdminPassword;

  @Override
  public void run(ApplicationArguments args) throws Exception {
    if (accountRepository.existsByEmail(accountAdminEmail)) {
      return;
    }

    Account account = Account.builder()
        .email(accountAdminEmail)
        .password(passwordEncoder.encode(accountAdminPassword))
        .role(Role.ADMIN)
        .build();

    accountRepository.save(account);
  }
}
