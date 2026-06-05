package com.naodab.mailservice.dto;

import java.time.Instant;

import com.naodab.mailservice.models.NotificationType;

import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;
import lombok.AccessLevel;

@Getter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NotificationResponse {
  String id;
  NotificationType type;
  String title;
  String body;
  String link;
  boolean read;
  Instant createdAt;
  String orderId;
  String orderType;
}
