package com.naodab.mailservice.dto;

import java.time.Instant;

import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;
import lombok.AccessLevel;

@Getter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ConversationResponse {
  String id;
  String buyerProfileId;
  String sellerProfileId;
  String facilityId;
  String facilityName;
  String facilityImageUrl;
  String lastMessagePreview;
  Instant lastMessageAt;
  long unreadCount;
  Instant createdAt;
  Instant updatedAt;
}
