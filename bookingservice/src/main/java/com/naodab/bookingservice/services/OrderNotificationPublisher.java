package com.naodab.bookingservice.services;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.naodab.bookingservice.clients.ProductClients;
import com.naodab.bookingservice.clients.ProfileClients;
import com.naodab.bookingservice.dto.events.OrderNotificationEvent;
import com.naodab.bookingservice.dto.events.OrderNotificationEvent.OrderNotificationKind;
import com.naodab.bookingservice.dto.response.ListingVariantContextResponse;
import com.naodab.bookingservice.kafka.producers.OrderNotificationProducer;
import com.naodab.bookingservice.models.Customer;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderNotificationPublisher {

  private static final String ORDER_TYPE_BUY = "BUY";
  private static final String ORDER_TYPE_RENT = "RENT";
  private static final String ROLE_BUYER = "BUYER";
  private static final String ROLE_SELLER = "SELLER";
  private static final String ACTOR_BUYER = "BUYER";
  private static final String ACTOR_SELLER = "SELLER";

  OrderNotificationProducer orderNotificationProducer;
  ProductClients productClients;
  ProfileClients profileClients;

  public void publishBuyOrderCreated(
      String orderId, String listingVariantId, String buyerProfileId, Customer customer) {
    publishCreated(orderId, ORDER_TYPE_BUY, listingVariantId, buyerProfileId, customer);
  }

  public void publishRentOrderCreated(
      String orderId, String listingVariantId, String buyerProfileId, Customer customer) {
    publishCreated(orderId, ORDER_TYPE_RENT, listingVariantId, buyerProfileId, customer);
  }

  public void publishBuyOrderConfirmed(
      String orderId, String listingVariantId, String buyerProfileId, Customer customer) {
    publish(
        event(
            OrderNotificationKind.ORDER_CONFIRMED,
            orderId,
            ORDER_TYPE_BUY,
            listingVariantId,
            "CONFIRMED",
            "PENDING",
            buyerProfileId,
            ROLE_BUYER,
            buyerProfileId,
            null,
            customer,
            null),
        customer);
  }

  public void publishRentOrderConfirmed(
      String orderId, String listingVariantId, String buyerProfileId, Customer customer) {
    publish(
        event(
            OrderNotificationKind.ORDER_CONFIRMED,
            orderId,
            ORDER_TYPE_RENT,
            listingVariantId,
            "CONFIRMED",
            "PENDING",
            buyerProfileId,
            ROLE_BUYER,
            buyerProfileId,
            null,
            customer,
            null),
        customer);
  }

  public void publishBuyOrderCancelledBySeller(
      String orderId, String listingVariantId, String buyerProfileId, Customer customer) {
    publish(
        event(
            OrderNotificationKind.ORDER_CANCELLED,
            orderId,
            ORDER_TYPE_BUY,
            listingVariantId,
            "CANCELLED",
            "PENDING",
            buyerProfileId,
            ROLE_BUYER,
            buyerProfileId,
            null,
            customer,
            ACTOR_SELLER),
        customer);
  }

  public void publishRentOrderCancelledBySeller(
      String orderId, String listingVariantId, String buyerProfileId, Customer customer) {
    publish(
        event(
            OrderNotificationKind.ORDER_CANCELLED,
            orderId,
            ORDER_TYPE_RENT,
            listingVariantId,
            "CANCELLED",
            "PENDING",
            buyerProfileId,
            ROLE_BUYER,
            buyerProfileId,
            null,
            customer,
            ACTOR_SELLER),
        customer);
  }

  public void publishBuyOrderCancelledByBuyer(
      String orderId, String listingVariantId, String buyerProfileId, Customer customer) {
    publishCancelledByBuyer(orderId, ORDER_TYPE_BUY, listingVariantId, buyerProfileId, customer);
  }

  public void publishRentOrderCancelledByBuyer(
      String orderId, String listingVariantId, String buyerProfileId, Customer customer) {
    publishCancelledByBuyer(orderId, ORDER_TYPE_RENT, listingVariantId, buyerProfileId, customer);
  }

  public void publishBuyOrderStatusChanged(
      String orderId,
      String listingVariantId,
      String buyerProfileId,
      Customer customer,
      String previousStatus,
      String newStatus) {
    publishStatusChanged(
        orderId, ORDER_TYPE_BUY, listingVariantId, buyerProfileId, customer, previousStatus, newStatus);
  }

  public void publishRentOrderStatusChanged(
      String orderId,
      String listingVariantId,
      String buyerProfileId,
      Customer customer,
      String previousStatus,
      String newStatus) {
    publishStatusChanged(
        orderId, ORDER_TYPE_RENT, listingVariantId, buyerProfileId, customer, previousStatus, newStatus);
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
          event(
              OrderNotificationKind.ORDER_CREATED,
              orderId,
              orderType,
              listingVariantId,
              "PENDING",
              null,
              sellerProfileId,
              ROLE_SELLER,
              buyerProfileId,
              sellerProfileId,
              customer,
              null),
          customer);
    }
    publish(
        event(
            OrderNotificationKind.ORDER_CREATED,
            orderId,
            orderType,
            listingVariantId,
            "PENDING",
            null,
            buyerProfileId,
            ROLE_BUYER,
            buyerProfileId,
            sellerProfileId,
            customer,
            null),
        customer);
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
          event(
              OrderNotificationKind.ORDER_CANCELLED,
              orderId,
              orderType,
              listingVariantId,
              "CANCELLED",
              "PENDING",
              sellerProfileId,
              ROLE_SELLER,
              buyerProfileId,
              sellerProfileId,
              customer,
              ACTOR_BUYER),
          customer);
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
        event(
            OrderNotificationKind.ORDER_STATUS_CHANGED,
            orderId,
            orderType,
            listingVariantId,
            newStatus,
            previousStatus,
            buyerProfileId,
            ROLE_BUYER,
            buyerProfileId,
            null,
            customer,
            null),
        customer);
  }

  private OrderNotificationEvent event(
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
      Customer customer,
      String cancelledBy) {
    return OrderNotificationEvent.builder()
        .kind(kind)
        .orderId(orderId)
        .orderType(orderType)
        .listingVariantId(listingVariantId)
        .status(status)
        .previousStatus(previousStatus)
        .recipientProfileId(recipientProfileId)
        .recipientRole(recipientRole)
        .buyerProfileId(buyerProfileId)
        .sellerProfileId(sellerProfileId)
        .buyerDisplayName(displayName(customer))
        .cancelledBy(cancelledBy)
        .build();
  }

  private void publish(OrderNotificationEvent event) {
    publish(event, null);
  }

  private void publish(OrderNotificationEvent event, Customer customer) {
    if (event == null || !StringUtils.hasText(event.getRecipientProfileId())) {
      return;
    }
    enrich(event, customer);
    orderNotificationProducer.send(event);
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
    if (ROLE_BUYER.equalsIgnoreCase(event.getRecipientRole())
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
}
