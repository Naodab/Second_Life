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

  /** Recommended price in VND (buy price or rent fee per unit). */
  Long suggestedPriceVnd;

  Long priceMinVnd;

  Long priceMaxVnd;

  /** HIGH, MEDIUM, or LOW */
  String confidence;

  /** Short Vietnamese explanation. */
  String reasoningBrief;

  String listingType;

  String rentUnit;
}
