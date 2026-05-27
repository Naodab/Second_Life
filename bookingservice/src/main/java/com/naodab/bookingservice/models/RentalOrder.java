package com.naodab.bookingservice.models;

import java.time.LocalDateTime;

import com.naodab.bookingservice.models.enums.RentalOrderStatus;
import com.naodab.commonjpa.entity.BaseEntity;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Index;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "rental_orders", indexes = {
    @Index(name = "idx_rental_orders_customer_id", columnList = "customer_id"),
    @Index(name = "idx_rental_orders_listing_variant_id", columnList = "listing_variant_id"),
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class RentalOrder extends BaseEntity {
  @Id
  String id;

  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  @JoinColumn(name = "customer_id", nullable = false)
  Customer customer;

  String listingVariantId;

  Long price;

  Integer quantity;

  LocalDateTime startTime;
  LocalDateTime endTime;

  @Enumerated(EnumType.STRING)
  @Builder.Default
  RentalOrderStatus status = RentalOrderStatus.PENDING;
}
