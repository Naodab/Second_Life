package com.naodab.productservice.dto.request;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import com.naodab.productservice.models.Listing.ListingType;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
public class ListingCreateRequest {

  @NotBlank
  String productId;

  @NotBlank
  String facilityId;

  @NotBlank
  String title;

  @Size(max = 8096)
  String description;

  ListingType listingType;

  List<@Valid ListingVariantCreateRequest> variants;
}
