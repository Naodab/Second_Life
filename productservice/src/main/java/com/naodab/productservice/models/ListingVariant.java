package com.naodab.productservice.models;

import com.naodab.commonjpa.entity.BaseEntity;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Index;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "listing_variants", indexes = {
    @Index(name = "idx_listing_id", columnList = "listing_id"),
    @Index(name = "idx_product_variant_id", columnList = "product_variant_id"),
}, uniqueConstraints = @UniqueConstraint(columnNames = { "listing_id", "product_variant_id" }))
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class ListingVariant extends BaseEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  String id;

  @ManyToOne
  @JoinColumn(name = "listing_id", nullable = false)
  Listing listing;

  @ManyToOne
  @JoinColumn(name = "product_variant_id", nullable = false)
  ProductVariant productVariant;

  Double buyPrice;
  Double rentPrice;

  Double aiSuggestedBuyPrice;
  Double aiSuggestedRentPrice;

  @Enumerated(EnumType.STRING)
  @Builder.Default
  RentUnit rentUnit = RentUnit.DAY;

  @Builder.Default
  Boolean isActive = true;

  public enum RentUnit {
    HOUR,
    DAY,
    WEEK,
    MONTH,
  }
}
