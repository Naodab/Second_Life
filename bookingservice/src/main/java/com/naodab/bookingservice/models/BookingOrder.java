package com.naodab.bookingservice.models;

import com.naodab.commonjpa.entity.BaseEntity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

import com.naodab.bookingservice.models.enums.BookingOrderStatus;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "orders", indexes = {
    @Index(name = "idx_orders_listing_variant_id", columnList = "listing_variant_id"),
    @Index(name = "idx_orders_customer_id", columnList = "customer_id"),
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class BookingOrder extends BaseEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  String id;

  @ManyToOne(optional = false, fetch = FetchType.LAZY)
  @JoinColumn(name = "customer_id", nullable = false)
  Customer customer;

  String listingVariantId;

  Long price;

  Integer quantity;

  LocalDateTime pickupTime;

  @Enumerated(EnumType.STRING)
  @Builder.Default
  BookingOrderStatus status = BookingOrderStatus.PENDING;
}
