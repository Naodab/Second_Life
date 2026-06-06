package com.naodab.mailservice.dto;

import java.time.Instant;
import java.util.List;

import com.naodab.mailservice.models.MessageOrderCard;
import com.naodab.mailservice.models.MessageProductCard;

import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;
import lombok.AccessLevel;

@Getter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MessageResponse {
  String id;
  String conversationId;
  String senderProfileId;
  String content;
  List<String> imageUrls;
  MessageProductCard productCard;
  MessageOrderCard orderCard;
  Instant createdAt;
}
