package com.naodab.productservice.dto.response;

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
public class AiSuggestPriceResponse {
  Long suggestedPriceVnd;
  Long priceMinVnd;
  Long priceMaxVnd;
  String confidence;
  String reasoningBrief;
  String listingType;
  String rentUnit;
}
