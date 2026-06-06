package com.naodab.mailservice.models;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Document(collection = "messages")
@CompoundIndexes({
    @CompoundIndex(name = "idx_conversation_created", def = "{'conversationId': 1, 'createdAt': 1}")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MessageDocument {
  @Id
  String id;

  String conversationId;
  String senderProfileId;
  String content;
  @Builder.Default
  List<String> imageUrls = new ArrayList<>();
  MessageProductCard productCard;
  MessageOrderCard orderCard;
  @Builder.Default
  Instant createdAt = Instant.now();
}
