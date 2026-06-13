package com.naodab.productservice.dto.response;

import java.util.List;

import com.naodab.productservice.models.Listing.ListingStatus;
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
public class ListingResponse {
  String id;
  String productId;
  String facilityId;
  String title;
  String description;
  ListingType listingType;
  ListingStatus listingStatus;
  Double minPrice;
  Double maxPrice;
  Double aiSuggestedBuyPrice;
  Double aiSuggestedRentPrice;
  List<ListingVariantResponse> variants;
}
