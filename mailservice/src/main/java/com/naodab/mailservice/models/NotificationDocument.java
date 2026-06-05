package com.naodab.mailservice.models;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import lombok.AccessLevel;

@Document(collection = "notifications")
@CompoundIndexes({
    @CompoundIndex(name = "idx_profile_created", def = "{'profileId': 1, 'createdAt': -1}"),
    @CompoundIndex(name = "idx_profile_read", def = "{'profileId': 1, 'read': 1}")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class NotificationDocument {
  @Id
  String id;

  String profileId;
  NotificationType type;
  String title;
  String body;
  String link;
  @Builder.Default
  boolean read = false;
  @Builder.Default
  Instant createdAt = Instant.now();
  String orderId;
  String orderType;
}
