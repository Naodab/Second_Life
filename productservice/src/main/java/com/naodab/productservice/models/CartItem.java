package com.naodab.productservice.models;

import com.naodab.commonjpa.entity.BaseEntity;
import com.naodab.productservice.models.ListingVariant.RentUnit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "cart_items", indexes = {
    @Index(name = "idx_cart_profile_id", columnList = "profile_id"),
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CartItem extends BaseEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  String id;

  @Column(name = "profile_id", nullable = false, length = 64)
  String profileId;

  @Column(name = "listing_id", nullable = false, length = 36)
  String listingId;

  @Column(name = "listing_variant_id", nullable = false, length = 36)
  String listingVariantId;

  @Column(nullable = false)
  Integer quantity;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 16)
  CartMode mode;

  @Column(name = "rental_start")
  LocalDateTime rentalStart;

  @Column(name = "rental_end")
  LocalDateTime rentalEnd;

  @Enumerated(EnumType.STRING)
  @Column(name = "rent_unit", length = 16)
  RentUnit rentUnit;
}
