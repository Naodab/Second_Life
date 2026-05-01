package com.naodab.productservice.dto.response;

import com.naodab.productservice.models.ListingVariant.RentUnit;

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
public class ListingVariantResponse {
  String id;
  String productVariantId;
  Double buyPrice;
  Double rentPrice;
  RentUnit rentUnit;
  Boolean isActive;
}
