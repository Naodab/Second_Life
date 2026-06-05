package com.naodab.mailservice.service;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.naodab.commonservice.constant.OrderNotificationConstants;
import com.naodab.commonservice.event.OrderNotificationEvent;
import com.naodab.commonservice.event.OrderNotificationEvent.OrderNotificationKind;
import com.naodab.mailservice.models.NotificationDocument;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderNotificationEmailService {

  MailService mailService;
  NotificationMessageFactory notificationMessageFactory;

  @Async
  public void sendOrderNotification(OrderNotificationEvent event, NotificationDocument document) {
    if (event == null || document == null || !StringUtils.hasText(event.getRecipientEmail())) {
      return;
    }
    if (event.getKind() == OrderNotificationKind.ORDER_CREATED
        && OrderNotificationConstants.ROLE_SELLER.equalsIgnoreCase(event.getRecipientRole())) {
      return;
    }
    try {
      mailService.sendOrderNotification(
          event.getRecipientEmail().trim(),
          document.getTitle(),
          document.getBody(),
          notificationMessageFactory.toAbsoluteLink(document.getLink()),
          event.getProductTitle(),
          event.getThumbnailUrl(),
          event.getOrderId(),
          event.getOrderType());
    } catch (RuntimeException ex) {
      log.warn(
          "Failed to send order notification email for order {} to {}: {}",
          event.getOrderId(),
          event.getRecipientEmail(),
          ex.getMessage());
    }
  }
}
