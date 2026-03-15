package com.naodab.mailservice.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.naodab.mailservice.dto.EmailVerificationEvent;
import com.naodab.mailservice.service.MailService;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/api/test")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class TestController {
  MailService mailService;

  @GetMapping("/email-verification")
  public String getMethodName() {
    mailService.sendEmailVerification(EmailVerificationEvent.builder()
        .toEmail("nguyenhobadoan@gmail.com")
        .verificationToken("test-token")
        .build());
    return new String();
  }
}
