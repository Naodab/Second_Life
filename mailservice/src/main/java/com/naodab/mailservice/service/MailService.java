package com.naodab.mailservice.service;

import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import com.naodab.mailservice.dto.EmailVerificationEvent;
import com.naodab.mailservice.dto.ForgotPasswordEvent;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MailService {
  JavaMailSender mailSender;
  SpringTemplateEngine templateEngine;

  @NonFinal
  @Value("${app.mail.from}")
  String mailFrom;

  @NonFinal
  @Value("${app.mail.from-name}")
  String mailFromName;

  @NonFinal
  @Value("${app.mail.base-url}")
  String mailBaseUrl;

  @Async
  public void sendEmailVerification(EmailVerificationEvent event) {
    String subject = "Please verify your email address";
    String link = (event.getVerificationLink() != null)
        ? event.getVerificationLink()
        : mailBaseUrl + "/verify-email?token=" + event.getVerificationToken();
    Context context = new Context();
    context.setVariable("username", event.getUsername());
    context.setVariable("verificationLink", link);
    context.setVariable("baseUrl", mailBaseUrl);

    String htmlContent = templateEngine.process("/email/email-verification.html", context);
    sendHtml(event.getToEmail(), subject, htmlContent);
  }

  @Async
  public void sendForgotPassword(ForgotPasswordEvent event) {
    String subject = "Password Reset Request";
    String link = (event.getResetPasswordLink() != null)
        ? event.getResetPasswordLink()
        : mailBaseUrl + "/reset-password?token=" + event.getResetPasswordToken();
    Context context = new Context();
    context.setVariable("username", event.getUsername());
    context.setVariable("resetLink", link);
    context.setVariable("baseUrl", mailBaseUrl);

    String htmlContent = templateEngine.process("/email/password-reset.html", context);
    sendHtml(event.getToEmail(), subject, htmlContent);
  }

  @SuppressWarnings("null")
  private void sendHtml(String to, String subject, String htmlContent) {
    try {
      MimeMessage message = mailSender.createMimeMessage();
      var helper = new MimeMessageHelper(
          message,
          MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
          StandardCharsets.UTF_8.name());

      helper.setFrom(mailFrom, mailFromName);
      helper.setTo(to);
      helper.setSubject(subject);
      helper.setText(htmlContent, true);

      ClassPathResource logoImage = new ClassPathResource("/static/images/logo.png");
      helper.addInline("logo", logoImage);

      mailSender.send(message);
    } catch (MessagingException | UnsupportedEncodingException e) {
      log.error("[MAIL] Fail to send email to {}: {}", to, e.getMessage());
      throw new RuntimeException("Fail to send email: " + e.getMessage(), e);
    }
  }
}
