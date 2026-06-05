package com.naodab.mailservice.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;
import org.thymeleaf.spring6.SpringTemplateEngine;

import com.naodab.mailservice.dto.OrderNotificationEvent;
import com.naodab.mailservice.dto.OrderNotificationEvent.OrderNotificationKind;
import com.naodab.mailservice.models.NotificationDocument;
import com.naodab.mailservice.models.NotificationType;

import jakarta.mail.internet.MimeMessage;
import org.springframework.web.client.RestTemplate;

@ExtendWith(MockitoExtension.class)
class MailServiceOrderNotificationTest {

  @Mock
  JavaMailSender mailSender;

  @Mock
  SpringTemplateEngine templateEngine;

  @Mock
  RestTemplate restTemplate;

  @InjectMocks
  MailService mailService;

  @BeforeEach
  void setUp() {
    ReflectionTestUtils.setField(mailService, "mailFrom", "noreply@test.com");
    ReflectionTestUtils.setField(mailService, "mailFromName", "Second Life");
    ReflectionTestUtils.setField(mailService, "mailBaseUrl", "http://localhost:8080");
  }

  @Test
  void sendOrderNotification_processesTemplateWithProductImage() throws Exception {
    when(mailSender.createMimeMessage()).thenReturn(mock(MimeMessage.class));
    when(templateEngine.process(eq("email/order-notification"), any())).thenReturn("<html>ok</html>");
    when(restTemplate.getForObject("https://cdn.example.com/item.jpg", byte[].class))
        .thenReturn(new byte[] {1, 2, 3});

    mailService.sendOrderNotification(
        "buyer@test.com",
        "Đơn hàng đã được xác nhận",
        "Đơn mua #12345678 đã được người bán xác nhận.",
        "http://localhost:5173/orders",
        "Máy ảnh mirrorless",
        "https://cdn.example.com/item.jpg",
        "order-12345678",
        "BUY");

    verify(templateEngine).process(eq("email/order-notification"), any());
  }

  @Test
  void orderNotificationEmailService_delegatesWhenRecipientEmailPresent() {
    MailService mailServiceMock = mock(MailService.class);
    OrderNotificationEmailService emailService = new OrderNotificationEmailService(mailServiceMock);
    NotificationDocument document = NotificationDocument.builder()
        .title("Đơn hàng mới")
        .body("Có đơn mới")
        .link("http://localhost:5173/manage/products")
        .type(NotificationType.ORDER)
        .build();
    OrderNotificationEvent event = OrderNotificationEvent.builder()
        .kind(OrderNotificationKind.ORDER_CREATED)
        .recipientEmail("seller@test.com")
        .orderId("order-1")
        .orderType("BUY")
        .productTitle("Áo khoác")
        .thumbnailUrl("https://cdn.example.com/jacket.jpg")
        .build();

    emailService.sendOrderNotification(event, document);

    verify(mailServiceMock).sendOrderNotification(
        "seller@test.com",
        "Đơn hàng mới",
        "Có đơn mới",
        "http://localhost:5173/manage/products",
        "Áo khoác",
        "https://cdn.example.com/jacket.jpg",
        "order-1",
        "BUY");
  }
}
