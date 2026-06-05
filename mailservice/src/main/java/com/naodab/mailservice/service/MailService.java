package com.naodab.mailservice.service;

import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.commonservice.util.PublicUrlHelper;
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
  RestTemplate restTemplate;

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
    String link = StringUtils.hasText(event.getVerificationLink())
        ? event.getVerificationLink().trim()
        : PublicUrlHelper.buildVerifyEmailUrl(
            PublicUrlHelper.resolveAuthPublicApiBase(null, mailBaseUrl),
            event.getVerificationToken());
    Context context = new Context();
    context.setVariable("username", event.getUsername());
    context.setVariable("verificationLink", link);
    context.setVariable("baseUrl", mailBaseUrl);

    String htmlContent = templateEngine.process("email/email-verification", context);
    sendHtml(event.getToEmail(), subject, htmlContent, null);
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

    String htmlContent = templateEngine.process("email/password-reset", context);
    sendHtml(event.getToEmail(), subject, htmlContent, null);
  }

  @Async
  public void sendOrderNotification(
      String toEmail,
      String title,
      String body,
      String actionLink,
      String productTitle,
      String thumbnailUrl,
      String orderId,
      String orderType) {
    if (!StringUtils.hasText(toEmail) || !StringUtils.hasText(title)) {
      return;
    }

    Context context = new Context();
    context.setVariable("title", title.trim());
    context.setVariable("body", body != null ? body : "");
    context.setVariable("actionLink", StringUtils.hasText(actionLink) ? actionLink.trim() : null);
    context.setVariable("actionLabel", actionLabel(orderType));
    context.setVariable("productTitle", StringUtils.hasText(productTitle) ? productTitle.trim() : null);
    context.setVariable("orderLabel", shortOrderId(orderId));
    context.setVariable("baseUrl", mailBaseUrl);

    Resource productImage = loadRemoteImage(thumbnailUrl);
    context.setVariable("hasProductImage", productImage != null);

    String htmlContent = templateEngine.process("email/order-notification", context);
    sendHtml(toEmail.trim(), title.trim(), htmlContent, productImage);
  }

  private void sendHtml(String to, String subject, String htmlContent, Resource productImage) {
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

      helper.addInline("logo", new ClassPathResource("/static/images/logo.png"));
      if (productImage != null) {
        helper.addInline("productImage", productImage);
      }

      mailSender.send(message);
    } catch (MessagingException | UnsupportedEncodingException e) {
      log.error("[MAIL] Fail to send email to {}: {}", to, e.getMessage());
      throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR);
    }
  }

  private Resource loadRemoteImage(String thumbnailUrl) {
    if (!StringUtils.hasText(thumbnailUrl)) {
      return null;
    }
    String url = thumbnailUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return null;
    }
    try {
      byte[] bytes = restTemplate.getForObject(url, byte[].class);
      if (bytes == null || bytes.length == 0) {
        return null;
      }
      return new ByteArrayResource(bytes);
    } catch (RuntimeException ex) {
      log.warn("[MAIL] Could not load product image from {}: {}", url, ex.getMessage());
      return null;
    }
  }

  private static String shortOrderId(String orderId) {
    if (!StringUtils.hasText(orderId)) {
      return null;
    }
    String trimmed = orderId.trim();
    return trimmed.length() <= 8 ? trimmed : trimmed.substring(trimmed.length() - 8);
  }

  private static String actionLabel(String orderType) {
    return "RENT".equalsIgnoreCase(orderType) ? "Xem đơn thuê" : "Xem đơn hàng";
  }
}
