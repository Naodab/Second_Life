package com.naodab.mailservice.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.naodab.commonservice.constant.OrderNotificationConstants;
import com.naodab.commonservice.event.OrderNotificationEvent;
import com.naodab.mailservice.models.NotificationDocument;
import com.naodab.mailservice.models.NotificationType;

import lombok.experimental.FieldDefaults;
import lombok.AccessLevel;
import lombok.experimental.NonFinal;

@Component
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NotificationMessageFactory {

  private static final String RENT_ORDER_PREFIX = "Đơn thuê #";
  private static final String BUY_ORDER_PREFIX = "Đơn mua #";

  @NonFinal
  @Value("${app.frontend.url:http://localhost:5173}")
  String frontendUrl;

  public NotificationDocument buildDocument(OrderNotificationEvent event) {
    MessageContent content = buildContent(event);
    return NotificationDocument.builder()
        .profileId(event.getRecipientProfileId().trim())
        .type(content.type())
        .title(content.title())
        .body(content.body())
        .link(content.link())
        .read(false)
        .orderId(event.getOrderId())
        .orderType(event.getOrderType())
        .build();
  }

  private MessageContent buildContent(OrderNotificationEvent event) {
    String orderLabel = shortOrderId(event.getOrderId());
    String buyerName = StringUtils.hasText(event.getBuyerDisplayName())
        ? event.getBuyerDisplayName().trim()
        : "Khách hàng";
    boolean sellerRecipient =
        OrderNotificationConstants.ROLE_SELLER.equalsIgnoreCase(event.getRecipientRole());
    String buyerLink = normalizeLink("/orders");
    String sellerLink = normalizeLink("/manage/products");

    return switch (event.getKind()) {
      case ORDER_CREATED -> sellerRecipient
          ? new MessageContent(
              NotificationType.ORDER,
              "Đơn hàng mới",
              buyerName + " vừa đặt " + orderKindLabel(event.getOrderType())
                  + " #" + orderLabel + ". Vui lòng xác nhận đơn.",
              sellerLink)
          : new MessageContent(
              NotificationType.ORDER,
              "Đặt hàng thành công",
              "Đơn " + orderKindLabel(event.getOrderType()) + " #" + orderLabel
                  + " đã được ghi nhận và đang chờ xác nhận.",
              buyerLink);
      case ORDER_CONFIRMED -> new MessageContent(
          NotificationType.ORDER,
          "Đơn hàng đã được xác nhận",
          "Đơn " + orderKindLabel(event.getOrderType()) + " #" + orderLabel
              + " đã được người bán xác nhận.",
          buyerLink);
      case ORDER_CANCELLED -> sellerRecipient
          ? new MessageContent(
              NotificationType.ORDER,
              "Đơn hàng bị hủy",
              buyerName + " đã hủy đơn " + orderKindLabel(event.getOrderType())
                  + " #" + orderLabel + ".",
              sellerLink)
          : new MessageContent(
              NotificationType.ORDER,
              "Đơn hàng đã bị hủy",
              cancelledByBuyerMessage(event, orderLabel),
              buyerLink);
      case ORDER_STATUS_CHANGED -> buildStatusChanged(event, orderLabel, buyerLink);
    };
  }

  private MessageContent buildStatusChanged(
      OrderNotificationEvent event, String orderLabel, String buyerLink) {
    String status = event.getStatus() != null ? event.getStatus().trim().toUpperCase() : "";
    return switch (status) {
      case "SHIPPED" -> new MessageContent(
          NotificationType.DELIVERY,
          "Đơn hàng đang giao",
          BUY_ORDER_PREFIX + orderLabel + " đang được vận chuyển.",
          buyerLink);
      case "DELIVERED" -> new MessageContent(
          NotificationType.DELIVERY,
          "Đơn hàng đã giao",
          deliveredMessage(event, orderLabel),
          buyerLink);
      case "RETURNED" -> new MessageContent(
          NotificationType.DELIVERY,
          "Đã nhận lại hàng thuê",
          RENT_ORDER_PREFIX + orderLabel + " đã được trả và đang chờ hoàn tất.",
          buyerLink);
      case "COMPLETED" -> new MessageContent(
          NotificationType.ORDER,
          "Đơn thuê hoàn tất",
          RENT_ORDER_PREFIX + orderLabel + " đã hoàn tất.",
          buyerLink);
      default -> new MessageContent(
          NotificationType.ORDER,
          "Cập nhật đơn hàng",
          "Đơn " + orderKindLabel(event.getOrderType()) + " #" + orderLabel
              + " chuyển sang trạng thái " + status + ".",
          buyerLink);
    };
  }

  private static String cancelledByBuyerMessage(OrderNotificationEvent event, String orderLabel) {
    if (OrderNotificationConstants.ACTOR_SELLER.equalsIgnoreCase(event.getCancelledBy())) {
      return "Người bán đã hủy đơn " + orderKindLabel(event.getOrderType()) + " #" + orderLabel + ".";
    }
    return "Đơn " + orderKindLabel(event.getOrderType()) + " #" + orderLabel + " đã được hủy.";
  }

  private static String deliveredMessage(OrderNotificationEvent event, String orderLabel) {
    if (OrderNotificationConstants.ORDER_TYPE_RENT.equalsIgnoreCase(event.getOrderType())) {
      return RENT_ORDER_PREFIX + orderLabel + " đã được bàn giao.";
    }
    return BUY_ORDER_PREFIX + orderLabel + " đã được giao thành công.";
  }

  private String normalizeLink(String path) {
    String base = frontendUrl != null ? frontendUrl.trim().replaceAll("/+$", "") : "";
    if (!StringUtils.hasText(base)) {
      return path;
    }
    return base + path;
  }

  private static String shortOrderId(String orderId) {
    if (!StringUtils.hasText(orderId)) {
      return "—";
    }
    String trimmed = orderId.trim();
    return trimmed.length() <= 8 ? trimmed : trimmed.substring(trimmed.length() - 8);
  }

  private static String orderKindLabel(String orderType) {
    return OrderNotificationConstants.ORDER_TYPE_RENT.equalsIgnoreCase(orderType) ? "thuê" : "mua";
  }

  private record MessageContent(NotificationType type, String title, String body, String link) {
  }
}
