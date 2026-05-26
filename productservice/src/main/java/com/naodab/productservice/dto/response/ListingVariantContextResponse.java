package com.naodab.productservice.dto.response;

import com.naodab.productservice.models.Listing.ListingType;

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
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class ListingVariantContextResponse {
  String listingId;
  String listingVariantId;
  String title;
  String productName;
  String variantLabel;
  String thumbnailUrl;
  String facilityId;
  ListingType listingType;
  Double buyPrice;
  Double rentPrice;
}
