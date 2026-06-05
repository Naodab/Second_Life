package com.naodab.bookingservice.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import lombok.AccessLevel;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ListingVariantContextResponse {
  String listingId;
  String listingVariantId;
  String title;
  String productName;
  String variantLabel;
  String thumbnailUrl;
  String facilityId;
  String listingType;
  Double buyPrice;
  Double rentPrice;
}
