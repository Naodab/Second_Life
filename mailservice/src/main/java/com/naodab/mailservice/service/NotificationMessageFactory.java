package com.naodab.mailservice.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.naodab.commonservice.constant.OrderNotificationConstants;
import com.naodab.commonservice.event.OrderNotificationEvent;
import com.naodab.commonservice.util.PublicUrlHelper;
import com.naodab.mailservice.models.NotificationDocument;
import com.naodab.mailservice.models.NotificationType;

import lombok.experimental.FieldDefaults;
import lombok.AccessLevel;
import lombok.experimental.NonFinal;

@Component
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NotificationMessageFactory {

  private static final String TAB_PENDING = "PENDING";
  private static final String TAB_CONFIRMED = "CONFIRMED";
  private static final String TAB_CANCELLED = "CANCELLED";

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
    String productName = productLabel(event);
    String buyerName = StringUtils.hasText(event.getBuyerDisplayName())
        ? event.getBuyerDisplayName().trim()
        : "Khách hàng";
    boolean sellerRecipient = OrderNotificationConstants.ROLE_SELLER.equalsIgnoreCase(event.getRecipientRole());

    return switch (event.getKind()) {
      case ORDER_CREATED -> sellerRecipient
          ? new MessageContent(
              NotificationType.ORDER,
              "Đơn hàng mới",
              buyerName + " vừa đặt " + productName + ". Vui lòng xác nhận đơn.",
              sellerOrdersLink(TAB_PENDING))
          : new MessageContent(
              NotificationType.ORDER,
              "Đặt hàng thành công",
              productName + " đã được ghi nhận và đang chờ xác nhận.",
              buyerOrdersLink(TAB_PENDING));
      case ORDER_CONFIRMED -> new MessageContent(
          NotificationType.ORDER,
          "Đơn hàng đã được xác nhận",
          productName + " đã được người bán xác nhận.",
          buyerOrdersLink(TAB_CONFIRMED));
      case ORDER_CANCELLED -> sellerRecipient
          ? new MessageContent(
              NotificationType.ORDER,
              "Đơn hàng bị hủy",
              buyerName + " đã hủy đơn " + productName + ".",
              sellerOrdersLink(TAB_CANCELLED))
          : new MessageContent(
              NotificationType.ORDER,
              "Đơn hàng đã bị hủy",
              cancelledByBuyerMessage(event, productName),
              buyerOrdersLink(TAB_CANCELLED));
      case ORDER_STATUS_CHANGED -> buildStatusChanged(event, productName);
    };
  }

  private MessageContent buildStatusChanged(OrderNotificationEvent event, String productName) {
    String status = event.getStatus() != null ? event.getStatus().trim().toUpperCase() : "";
    String buyerLink = buyerOrdersLink(statusTab(status));
    return switch (status) {
      case "SHIPPED" -> new MessageContent(
          NotificationType.DELIVERY,
          "Đơn hàng đang giao",
          productName + " đang được vận chuyển.",
          buyerLink);
      case "DELIVERED" -> new MessageContent(
          NotificationType.DELIVERY,
          "Đơn hàng đã giao",
          deliveredMessage(event, productName),
          buyerLink);
      case "RETURNED" -> new MessageContent(
          NotificationType.DELIVERY,
          "Đã nhận lại hàng thuê",
          productName + " đã được trả và đang chờ hoàn tất.",
          buyerLink);
      case "COMPLETED" -> new MessageContent(
          NotificationType.ORDER,
          "Đơn thuê hoàn tất",
          productName + " đã hoàn tất.",
          buyerLink);
      default -> new MessageContent(
          NotificationType.ORDER,
          "Cập nhật đơn hàng",
          productName + " chuyển sang trạng thái " + status + ".",
          buyerLink);
    };
  }

  private static String cancelledByBuyerMessage(OrderNotificationEvent event, String productName) {
    if (OrderNotificationConstants.ACTOR_SELLER.equalsIgnoreCase(event.getCancelledBy())) {
      return "Người bán đã hủy đơn " + productName + ".";
    }
    return productName + " đã được hủy.";
  }

  private static String deliveredMessage(OrderNotificationEvent event, String productName) {
    if (OrderNotificationConstants.ORDER_TYPE_RENT.equalsIgnoreCase(event.getOrderType())) {
      return productName + " đã được bàn giao.";
    }
    return productName + " đã được giao thành công.";
  }

  private String sellerOrdersLink(String tab) {
    return ordersLink("/manage/orders", tab);
  }

  private String buyerOrdersLink(String tab) {
    return ordersLink("/orders", tab);
  }

  private String ordersLink(String path, String tab) {
    if (!StringUtils.hasText(tab)) {
      return path;
    }
    return path + "?tab=" + tab.trim().toUpperCase();
  }

  private static String statusTab(String status) {
    if (!StringUtils.hasText(status)) {
      return TAB_PENDING;
    }
    return status.trim().toUpperCase();
  }

  /** Expands stored app paths for email hrefs. */
  public String toAbsoluteLink(String link) {
    if (!StringUtils.hasText(link)) {
      return link;
    }
    String trimmed = link.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    return normalizeLink(trimmed.startsWith("/") ? trimmed : "/" + trimmed);
  }

  private String normalizeLink(String path) {
    String base = PublicUrlHelper.stripTrailingSlash(frontendUrl);
    if (!StringUtils.hasText(base)) {
      return path;
    }
    return base + path;
  }

  private static String productLabel(OrderNotificationEvent event) {
    if (StringUtils.hasText(event.getProductTitle())) {
      return event.getProductTitle().trim();
    }
    String orderLabel = shortOrderId(event.getOrderId());
    return "sản phẩm #" + orderLabel;
  }

  private static String shortOrderId(String orderId) {
    if (!StringUtils.hasText(orderId)) {
      return "—";
    }
    String trimmed = orderId.trim();
    return trimmed.length() <= 8 ? trimmed : trimmed.substring(trimmed.length() - 8);
  }

  private record MessageContent(NotificationType type, String title, String body, String link) {
  }
}
