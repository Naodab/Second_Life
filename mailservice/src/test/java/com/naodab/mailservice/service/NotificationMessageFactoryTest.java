package com.naodab.mailservice.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import com.naodab.commonservice.event.OrderNotificationEvent;
import com.naodab.commonservice.event.OrderNotificationEvent.OrderNotificationKind;
import com.naodab.mailservice.models.NotificationDocument;
import com.naodab.mailservice.models.NotificationType;

class NotificationMessageFactoryTest {

  NotificationMessageFactory factory;

  @BeforeEach
  void setUp() {
    factory = new NotificationMessageFactory();
    ReflectionTestUtils.setField(factory, "frontendUrl", "http://localhost:5173");
  }

  @Test
  void buildDocument_forSellerOrderCreated() {
    NotificationDocument doc = factory.buildDocument(
        OrderNotificationEvent.builder()
            .kind(OrderNotificationKind.ORDER_CREATED)
            .orderId("order-12345678")
            .orderType("BUY")
            .recipientProfileId("seller-1")
            .recipientRole("SELLER")
            .buyerDisplayName("Linh Nguyen")
            .productTitle("Áo khoác denim vintage")
            .build());

    assertThat(doc.getType()).isEqualTo(NotificationType.ORDER);
    assertThat(doc.getTitle()).isEqualTo("Đơn hàng mới");
    assertThat(doc.getBody()).isEqualTo("Linh Nguyen vừa đặt Áo khoác denim vintage. Vui lòng xác nhận đơn.");
    assertThat(doc.getLink()).isEqualTo("/manage/orders?tab=PENDING");
    assertThat(doc.isRead()).isFalse();
  }

  @Test
  void buildDocument_forBuyerOrderConfirmed() {
    NotificationDocument doc = factory.buildDocument(
        OrderNotificationEvent.builder()
            .kind(OrderNotificationKind.ORDER_CONFIRMED)
            .orderId("order-abcdef12")
            .orderType("RENT")
            .recipientProfileId("buyer-1")
            .recipientRole("BUYER")
            .productTitle("Váy midi hoa nhí")
            .build());

    assertThat(doc.getTitle()).isEqualTo("Đơn hàng đã được xác nhận");
    assertThat(doc.getBody()).isEqualTo("Váy midi hoa nhí đã được người bán xác nhận.");
    assertThat(doc.getLink()).isEqualTo("/orders?tab=CONFIRMED");
  }
}
