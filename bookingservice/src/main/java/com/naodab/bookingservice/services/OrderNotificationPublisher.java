package com.naodab.bookingservice.services;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.naodab.bookingservice.clients.ProductClients;
import com.naodab.bookingservice.clients.ProfileClients;
import com.naodab.bookingservice.dto.response.ListingVariantContextResponse;
import com.naodab.bookingservice.kafka.producers.OrderNotificationProducer;
import com.naodab.bookingservice.models.Customer;
import com.naodab.commonservice.constant.OrderNotificationConstants;
import com.naodab.commonservice.event.OrderNotificationEvent;
import com.naodab.commonservice.event.OrderNotificationEvent.OrderNotificationKind;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderNotificationPublisher {

  OrderNotificationProducer orderNotificationProducer;
  ProductClients productClients;
  ProfileClients profileClients;

  public void publishBuyOrderCreated(
      String orderId, String listingVariantId, String buyerProfileId, Customer customer) {
    publishCreated(orderId, OrderNotificationConstants.ORDER_TYPE_BUY, listingVariantId, buyerProfileId, customer);
  }

  public void publishRentOrderCreated(
      String orderId, String listingVariantId, String buyerProfileId, Customer customer) {
    publishCreated(orderId, OrderNotificationConstants.ORDER_TYPE_RENT, listingVariantId, buyerProfileId, customer);
  }

  public void publishBuyOrderConfirmed(
      String orderId, String listingVariantId, String buyerProfileId, Customer customer) {
    publishConfirmed(orderId, OrderNotificationConstants.ORDER_TYPE_BUY, listingVariantId, buyerProfileId, customer);
  }

  public void publishRentOrderConfirmed(
      String orderId, String listingVariantId, String buyerProfileId, Customer customer) {
    publishConfirmed(orderId, OrderNotificationConstants.ORDER_TYPE_RENT, listingVariantId, buyerProfileId, customer);
  }

  public void publishBuyOrderCancelledBySeller(
      String orderId, String listingVariantId, String buyerProfileId, Customer customer) {
    publishCancelledToBuyer(
        orderId,
        OrderNotificationConstants.ORDER_TYPE_BUY,
        listingVariantId,
        buyerProfileId,
        customer,
        OrderNotificationConstants.ACTOR_SELLER);
  }

  public void publishRentOrderCancelledBySeller(
      String orderId, String listingVariantId, String buyerProfileId, Customer customer) {
    publishCancelledToBuyer(
        orderId,
        OrderNotificationConstants.ORDER_TYPE_RENT,
        listingVariantId,
        buyerProfileId,
        customer,
        OrderNotificationConstants.ACTOR_SELLER);
  }

  public void publishBuyOrderCancelledByBuyer(
      String orderId, String listingVariantId, String buyerProfileId, Customer customer) {
    publishCancelledByBuyer(orderId, OrderNotificationConstants.ORDER_TYPE_BUY, listingVariantId, buyerProfileId, customer);
  }

  public void publishRentOrderCancelledByBuyer(
      String orderId, String listingVariantId, String buyerProfileId, Customer customer) {
    publishCancelledByBuyer(orderId, OrderNotificationConstants.ORDER_TYPE_RENT, listingVariantId, buyerProfileId, customer);
  }

  public void publishBuyOrderStatusChanged(
      String orderId,
      String listingVariantId,
      String buyerProfileId,
      Customer customer,
      String previousStatus,
      String newStatus) {
    publishStatusChanged(
        orderId, OrderNotificationConstants.ORDER_TYPE_BUY, listingVariantId, buyerProfileId, customer, previousStatus, newStatus);
  }

  public void publishRentOrderStatusChanged(
      String orderId,
      String listingVariantId,
      String buyerProfileId,
      Customer customer,
      String previousStatus,
      String newStatus) {
    publishStatusChanged(
        orderId, OrderNotificationConstants.ORDER_TYPE_RENT, listingVariantId, buyerProfileId, customer, previousStatus, newStatus);
  }

  private void publishCreated(
      String orderId,
      String orderType,
      String listingVariantId,
      String buyerProfileId,
      Customer customer) {
    String sellerProfileId = resolveSellerProfileId(listingVariantId);
    if (StringUtils.hasText(sellerProfileId)) {
      publish(
          EventDraft.builder()
              .kind(OrderNotificationKind.ORDER_CREATED)
              .orderId(orderId)
              .orderType(orderType)
              .listingVariantId(listingVariantId)
              .status(OrderNotificationConstants.STATUS_PENDING)
              .recipientProfileId(sellerProfileId)
              .recipientRole(OrderNotificationConstants.ROLE_SELLER)
              .buyerProfileId(buyerProfileId)
              .sellerProfileId(sellerProfileId)
              .customer(customer)
              .build());
    }
    publish(
        EventDraft.builder()
            .kind(OrderNotificationKind.ORDER_CREATED)
            .orderId(orderId)
            .orderType(orderType)
            .listingVariantId(listingVariantId)
            .status(OrderNotificationConstants.STATUS_PENDING)
            .recipientProfileId(buyerProfileId)
            .recipientRole(OrderNotificationConstants.ROLE_BUYER)
            .buyerProfileId(buyerProfileId)
            .sellerProfileId(sellerProfileId)
            .customer(customer)
            .build());
  }

  private void publishConfirmed(
      String orderId,
      String orderType,
      String listingVariantId,
      String buyerProfileId,
      Customer customer) {
    publish(
        EventDraft.builder()
            .kind(OrderNotificationKind.ORDER_CONFIRMED)
            .orderId(orderId)
            .orderType(orderType)
            .listingVariantId(listingVariantId)
            .status(OrderNotificationConstants.STATUS_CONFIRMED)
            .previousStatus(OrderNotificationConstants.STATUS_PENDING)
            .recipientProfileId(buyerProfileId)
            .recipientRole(OrderNotificationConstants.ROLE_BUYER)
            .buyerProfileId(buyerProfileId)
            .customer(customer)
            .build());
  }

  private void publishCancelledToBuyer(
      String orderId,
      String orderType,
      String listingVariantId,
      String buyerProfileId,
      Customer customer,
      String cancelledBy) {
    publish(
        EventDraft.builder()
            .kind(OrderNotificationKind.ORDER_CANCELLED)
            .orderId(orderId)
            .orderType(orderType)
            .listingVariantId(listingVariantId)
            .status(OrderNotificationConstants.STATUS_CANCELLED)
            .previousStatus(OrderNotificationConstants.STATUS_PENDING)
            .recipientProfileId(buyerProfileId)
            .recipientRole(OrderNotificationConstants.ROLE_BUYER)
            .buyerProfileId(buyerProfileId)
            .cancelledBy(cancelledBy)
            .customer(customer)
            .build());
  }

  private void publishCancelledByBuyer(
      String orderId,
      String orderType,
      String listingVariantId,
      String buyerProfileId,
      Customer customer) {
    String sellerProfileId = resolveSellerProfileId(listingVariantId);
    if (StringUtils.hasText(sellerProfileId)) {
      publish(
          EventDraft.builder()
              .kind(OrderNotificationKind.ORDER_CANCELLED)
              .orderId(orderId)
              .orderType(orderType)
              .listingVariantId(listingVariantId)
              .status(OrderNotificationConstants.STATUS_CANCELLED)
              .previousStatus(OrderNotificationConstants.STATUS_PENDING)
              .recipientProfileId(sellerProfileId)
              .recipientRole(OrderNotificationConstants.ROLE_SELLER)
              .buyerProfileId(buyerProfileId)
              .sellerProfileId(sellerProfileId)
              .cancelledBy(OrderNotificationConstants.ACTOR_BUYER)
              .customer(customer)
              .build());
    }
  }

  private void publishStatusChanged(
      String orderId,
      String orderType,
      String listingVariantId,
      String buyerProfileId,
      Customer customer,
      String previousStatus,
      String newStatus) {
    publish(
        EventDraft.builder()
            .kind(OrderNotificationKind.ORDER_STATUS_CHANGED)
            .orderId(orderId)
            .orderType(orderType)
            .listingVariantId(listingVariantId)
            .status(newStatus)
            .previousStatus(previousStatus)
            .recipientProfileId(buyerProfileId)
            .recipientRole(OrderNotificationConstants.ROLE_BUYER)
            .buyerProfileId(buyerProfileId)
            .customer(customer)
            .build());
  }

  private void publish(EventDraft draft) {
    OrderNotificationEvent event = toEvent(draft);
    if (!StringUtils.hasText(event.getRecipientProfileId())) {
      return;
    }
    enrich(event, draft.customer());
    orderNotificationProducer.send(event);
  }

  private static OrderNotificationEvent toEvent(EventDraft draft) {
    return OrderNotificationEvent.builder()
        .kind(draft.kind())
        .orderId(draft.orderId())
        .orderType(draft.orderType())
        .listingVariantId(draft.listingVariantId())
        .status(draft.status())
        .previousStatus(draft.previousStatus())
        .recipientProfileId(draft.recipientProfileId())
        .recipientRole(draft.recipientRole())
        .buyerProfileId(draft.buyerProfileId())
        .sellerProfileId(draft.sellerProfileId())
        .buyerDisplayName(displayName(draft.customer()))
        .cancelledBy(draft.cancelledBy())
        .build();
  }

  private void enrich(OrderNotificationEvent event, Customer customer) {
    if (StringUtils.hasText(event.getListingVariantId())) {
      try {
        ListingVariantContextResponse context =
            productClients.getListingVariantContext(event.getListingVariantId().trim());
        if (context != null) {
          event.setProductTitle(resolveProductTitle(context));
          event.setThumbnailUrl(trimToNull(context.getThumbnailUrl()));
        }
      } catch (RuntimeException ex) {
        log.warn(
            "Could not resolve listing context for variant {}: {}",
            event.getListingVariantId(),
            ex.getMessage());
      }
    }
    event.setRecipientEmail(resolveRecipientEmail(event, customer));
  }

  private String resolveRecipientEmail(OrderNotificationEvent event, Customer customer) {
    if (OrderNotificationConstants.ROLE_BUYER.equalsIgnoreCase(event.getRecipientRole())
        && customer != null
        && StringUtils.hasText(customer.getEmail())) {
      return customer.getEmail().trim();
    }
    try {
      return profileClients.getProfileEmail(event.getRecipientProfileId());
    } catch (RuntimeException ex) {
      log.warn(
          "Could not resolve recipient email for profile {}: {}",
          event.getRecipientProfileId(),
          ex.getMessage());
      return null;
    }
  }

  private String resolveSellerProfileId(String listingVariantId) {
    if (!StringUtils.hasText(listingVariantId)) {
      return null;
    }
    try {
      return productClients.resolveOwnerProfileId(listingVariantId.trim());
    } catch (RuntimeException ex) {
      log.warn("Could not resolve seller profile for listing variant {}: {}", listingVariantId, ex.getMessage());
      return null;
    }
  }

  private static String resolveProductTitle(ListingVariantContextResponse context) {
    if (StringUtils.hasText(context.getTitle())) {
      return context.getTitle().trim();
    }
    if (StringUtils.hasText(context.getProductName())) {
      return context.getProductName().trim();
    }
    return null;
  }

  private static String trimToNull(String value) {
    if (!StringUtils.hasText(value)) {
      return null;
    }
    return value.trim();
  }

  private static String displayName(Customer customer) {
    if (customer == null) {
      return "Khách hàng";
    }
    String first = customer.getFirstName() != null ? customer.getFirstName().trim() : "";
    String last = customer.getLastName() != null ? customer.getLastName().trim() : "";
    String full = (first + " " + last).trim();
    if (!full.isEmpty()) {
      return full;
    }
    if (StringUtils.hasText(customer.getEmail())) {
      return customer.getEmail().trim();
    }
    return "Khách hàng";
  }

  @Builder
  private record EventDraft(
      OrderNotificationKind kind,
      String orderId,
      String orderType,
      String listingVariantId,
      String status,
      String previousStatus,
      String recipientProfileId,
      String recipientRole,
      String buyerProfileId,
      String sellerProfileId,
      String cancelledBy,
      Customer customer) {
  }
}
