package com.naodab.productservice.dto.request;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.naodab.productservice.models.CartMode;
import com.naodab.productservice.models.ListingVariant.RentUnit;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class CartItemAddRequest {

  @NotBlank(message = "REQUIRED_FIELD")
  String listingId;

  @NotBlank(message = "REQUIRED_FIELD")
  String listingVariantId;

  @NotNull(message = "REQUIRED_FIELD")
  @Min(value = 1, message = "QUANTITY_MIN")
  Integer quantity;

  @NotNull(message = "REQUIRED_FIELD")
  CartMode mode;

  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  LocalDateTime rentalStart;

  @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
  LocalDateTime rentalEnd;

  RentUnit rentUnit;
}
