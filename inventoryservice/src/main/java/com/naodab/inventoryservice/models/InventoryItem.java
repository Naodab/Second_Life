package com.naodab.inventoryservice.models;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Index;

import com.naodab.commonjpa.entity.BaseEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "inventory_items", indexes = {
    @Index(name = "idx_listing_variant_id", columnList = "listing_variant_id"),
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class InventoryItem extends BaseEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  String id;

  String listingVariantId;
  Long buyQuantiy;
  Long rentQuantity;

  @Enumerated(EnumType.STRING)
  InventoryMode mode;

  public enum InventoryMode {
    BUY, RENT;
  }
}
