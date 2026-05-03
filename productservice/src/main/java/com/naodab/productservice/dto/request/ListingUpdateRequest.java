package com.naodab.productservice.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import com.naodab.productservice.models.Listing.ListingStatus;

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
public class ListingUpdateRequest {

  @Size(min = 3, max = 500)
  String title;

  @Size(max = 8096)
  String description;

  ListingStatus listingStatus;
}
