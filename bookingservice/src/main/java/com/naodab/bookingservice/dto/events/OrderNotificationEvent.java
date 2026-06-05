package com.naodab.bookingservice.dto.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import lombok.AccessLevel;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderNotificationEvent {

  OrderNotificationKind kind;
  String orderId;
  String orderType;
  String status;
  String previousStatus;
  String recipientProfileId;
  String recipientRole;
  String buyerProfileId;
  String sellerProfileId;
  String buyerDisplayName;
  String cancelledBy;
  String listingVariantId;
  String recipientEmail;
  String productTitle;
  String thumbnailUrl;

  public enum OrderNotificationKind {
    ORDER_CREATED,
    ORDER_CONFIRMED,
    ORDER_CANCELLED,
    ORDER_STATUS_CHANGED
  }
}
