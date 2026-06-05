package com.naodab.productservice.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "listings", indexes = {
    @Index(name = "idx_product_id", columnList = "product_id"),
    @Index(name = "idx_listing_facility_id", columnList = "facility_id"),
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class Listing {
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  String id;

  @ManyToOne
  @JoinColumn(name = "product_id", nullable = false)
  Product product;

  @ManyToOne
  @JoinColumn(name = "facility_id", nullable = false)
  Facility facility;

  String title;

  @Column(length = 8096)
  String description;

  @Enumerated(EnumType.STRING)
  @Builder.Default
  ListingType listingType = ListingType.BUY;

  @Enumerated(EnumType.STRING)
  @Builder.Default
  ListingStatus listingStatus = ListingStatus.PENDING;

  Double minPrice;
  Double maxPrice;

  public enum ListingType {
    BUY,
    RENT
  }

  public enum ListingStatus {
    ACTIVE,
    INACTIVE,
    PENDING,
    REJECTED;

    public static final List<ListingStatus> MANAGE_STATUSES =
        List.of(ACTIVE, INACTIVE, PENDING, REJECTED);
  }
}
