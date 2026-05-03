package com.naodab.productservice.dto.response;

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
public class ListingItemResponse {
  String id;
  String title;
  String description;
  ListingType listingType;
  ListingStatus listingStatus;
  Double minPrice;
  Double maxPrice;

  String productId;
  String productName;
  String thumbnailImage;

  String facilityId;
  String facilityName;
  String facilityImageUrl;
  String facilityAddress;
  Double averageRating;

  String primarySubCategoryName;
}
