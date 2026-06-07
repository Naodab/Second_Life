package com.naodab.mailservice.models;

import java.time.Instant;

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

@Document(collection = "conversations")
@CompoundIndexes({
    @CompoundIndex(name = "idx_buyer_facility", def = "{'buyerProfileId': 1, 'facilityId': 1}", unique = true),
    @CompoundIndex(name = "idx_buyer_last_message", def = "{'buyerProfileId': 1, 'lastMessageAt': -1}"),
    @CompoundIndex(name = "idx_seller_last_message", def = "{'sellerProfileId': 1, 'lastMessageAt': -1}")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ConversationDocument {
  @Id
  String id;

  @Builder.Default
  ConversationType conversationType = ConversationType.FACILITY;

  String buyerProfileId;
  String sellerProfileId;
  String facilityId;
  String facilityName;
  String facilityImageUrl;
  String lastMessagePreview;
  Instant lastMessageAt;
  @Builder.Default
  long unreadByBuyer = 0;
  @Builder.Default
  long unreadBySeller = 0;
  @Builder.Default
  Instant createdAt = Instant.now();
  @Builder.Default
  Instant updatedAt = Instant.now();
}
