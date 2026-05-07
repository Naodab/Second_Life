package com.naodab.productservice.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import com.naodab.productservice.models.ListingVariant.RentUnit;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@JsonIgnoreProperties(ignoreUnknown = true)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class ListingVariantCreateRequest {

  @NotBlank
  String productVariantId;

  @NotNull(message = "REQUIRED_FIELD")
  @PositiveOrZero(message = "INVALID_INPUT")
  Long quantity;

  Double buyPrice;
  Double rentPrice;
  RentUnit rentUnit;

  Boolean isActive;
}
