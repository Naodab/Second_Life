package com.naodab.inventoryservice.models;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PostPersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import org.springframework.data.domain.Persistable;

import com.naodab.commonjpa.entity.BaseEntity;

@Entity
@Table(name = "inventory_reservations", indexes = {
    @Index(name = "idx_res_listing_mode_status", columnList = "listing_variant_id, mode, status"),
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class InventoryReservation extends BaseEntity implements Persistable<String> {
  @Id
  String id;

  @Transient
  @Builder.Default
  boolean persisted = false;

  @PostLoad
  @PostPersist
  void markPersisted() {
    this.persisted = true;
  }

  @Override
  public boolean isNew() {
    return !persisted;
  }

  String listingVariantId;

  @Enumerated(EnumType.STRING)
  InventoryItem.InventoryMode mode;

  Long quantity;

  @Enumerated(EnumType.STRING)
  ReservationStatus status;

  String referenceId;

  LocalDateTime expiresAt;

  LocalDate rentalStart;

  LocalDate rentalEnd;

  LocalDateTime rentalSlotStart;

  LocalDateTime rentalSlotEnd;

  public enum ReservationStatus {
    PENDING,
    CONFIRMED,
    RELEASED
  }
}
