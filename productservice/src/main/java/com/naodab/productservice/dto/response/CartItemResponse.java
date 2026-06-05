package com.naodab.productservice.dto.response;

import java.time.LocalDateTime;

import com.naodab.productservice.models.CartMode;
import com.naodab.productservice.models.Listing.ListingType;
import com.naodab.productservice.models.ListingVariant.RentUnit;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CartItemResponse {

  String id;
  String listingId;
  String listingVariantId;
  Integer quantity;
  CartMode mode;
  LocalDateTime rentalStart;
  LocalDateTime rentalEnd;
  RentUnit rentUnit;
  LocalDateTime addedAt;

  String title;
  String productName;
  String variantLabel;
  String thumbnailUrl;
  String facilityId;
  ListingType listingType;
  Double buyPrice;
  Double rentPrice;
}
